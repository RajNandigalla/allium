import { FastifyInstance } from 'fastify';
import path from 'path';
import fs from 'fs-extra';
import { autoLoadModels } from '@allium/core';

export async function registerModelsRoutes(
  fastify: FastifyInstance,
  alliumDir: string,
  modelsDir: string,
  triggerSync: () => Promise<void>
) {
  // GET /_admin/models
  fastify.get(
    '/models',
    {
      schema: {
        tags: ['Admin - Models'],
        description: 'List all models',
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                fields: { type: 'array' },
                relations: { type: 'array' },
                routes: { type: 'object' },
              },
            },
          },
        },
      },
    },
    async () => {
      // 1. Try to read the aggregated schema first (fastest)
      const schemaPath = path.join(alliumDir, 'schema.json');
      if (await fs.pathExists(schemaPath)) {
        const schema = await fs.readJson(schemaPath);
        return schema.models || [];
      }

      // 2. Fallback to loading from source
      try {
        const models = await autoLoadModels(modelsDir);
        return models;
      } catch (error) {
        fastify.log.error(error);
        return [];
      }
    }
  );

  // POST /_admin/models
  fastify.post<{ Body: { name: string; fields: any[] } }>(
    '/models',
    {
      schema: {
        tags: ['Admin - Models'],
        description: 'Create a new model',
        body: {
          type: 'object',
          required: ['name'],
          properties: {
            name: {
              type: 'string',
              description: 'Model name (PascalCase)',
            },
            fields: {
              type: 'array',
              description: 'Model fields',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  type: { type: 'string' },
                  required: { type: 'boolean' },
                  unique: { type: 'boolean' },
                },
              },
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              model: { type: 'object' },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          409: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { name, fields } = req.body;

      if (!name) {
        return reply.code(400).send({ error: 'Model name is required' });
      }

      const modelName = name;
      const fileName = `${modelName.toLowerCase()}.json`;
      const filePath = path.join(alliumDir, 'models', fileName);

      // Check if exists
      if (await fs.pathExists(filePath)) {
        return reply.code(409).send({ error: 'Model already exists' });
      }

      const modelDef = {
        name: modelName,
        fields: fields || [],
        relations: [],
        // Default routes
        routes: {
          create: { path: `/${modelName.toLowerCase()}` },
          read: { path: `/${modelName.toLowerCase()}/:id` },
          update: { path: `/${modelName.toLowerCase()}/:id` },
          delete: { path: `/${modelName.toLowerCase()}/:id` },
          list: { path: `/${modelName.toLowerCase()}` },
        },
      };

      // Write JSON definition
      await fs.ensureDir(path.join(alliumDir, 'models'));
      await fs.writeJson(filePath, modelDef, { spaces: 2 });

      // Create TS Model File
      const tsFilePath = path.join(
        modelsDir,
        `${modelName.toLowerCase()}.model.ts`
      );
      if (!(await fs.pathExists(tsFilePath))) {
        const tsContent = `import { registerModel } from '@allium/core';

export const ${modelName} = registerModel('${modelName}', {
  // Add hooks here
});
`;
        await fs.ensureDir(modelsDir);
        await fs.writeFile(tsFilePath, tsContent);
      }

      await triggerSync();

      return { success: true, model: modelDef };
    }
  );

  // GET /_admin/models/:name
  fastify.get<{ Params: { name: string } }>(
    '/models/:name',
    {
      schema: {
        tags: ['Admin - Models'],
        description: 'Get a specific model definition',
        params: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              fields: { type: 'array' },
              relations: { type: 'array' },
              routes: { type: 'object' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { name } = req.params;
      const fileName = `${name.toLowerCase()}.json`;
      const filePath = path.join(alliumDir, 'models', fileName);

      if (!(await fs.pathExists(filePath))) {
        return reply.code(404).send({ error: 'Model not found' });
      }

      const model = await fs.readJson(filePath);
      return model;
    }
  );

  // PUT /_admin/models/:name
  fastify.put<{ Params: { name: string }; Body: any }>(
    '/models/:name',
    {
      schema: {
        tags: ['Admin - Models'],
        description: 'Update a model definition',
        params: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
        },
        body: {
          type: 'object',
          properties: {
            fields: { type: 'array' },
            relations: { type: 'array' },
            routes: { type: 'object' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              model: {
                type: 'object',
                additionalProperties: true, // Allow any properties in the model
              },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { name } = req.params;
      const fileName = `${name.toLowerCase()}.json`;
      const filePath = path.join(alliumDir, 'models', fileName);

      if (!(await fs.pathExists(filePath))) {
        return reply.code(404).send({ error: 'Model not found' });
      }

      const existingModel = await fs.readJson(filePath);
      const updates = req.body as Record<string, any>;
      const updatedModel = {
        ...existingModel,
        ...updates,
        name, // Preserve the name
      };

      await fs.writeJson(filePath, updatedModel, { spaces: 2 });
      await triggerSync();

      return { success: true, model: updatedModel };
    }
  );

  // DELETE /_admin/models/:name
  fastify.delete<{ Params: { name: string } }>(
    '/models/:name',
    {
      schema: {
        tags: ['Admin - Models'],
        description: 'Delete a model',
        params: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { name } = req.params;
      const fileName = `${name.toLowerCase()}.json`;
      const filePath = path.join(alliumDir, 'models', fileName);
      const tsFilePath = path.join(modelsDir, `${name.toLowerCase()}.model.ts`);

      if (!(await fs.pathExists(filePath))) {
        return reply.code(404).send({ error: 'Model not found' });
      }

      // Delete JSON definition
      await fs.remove(filePath);

      // Delete TS file if exists
      if (await fs.pathExists(tsFilePath)) {
        await fs.remove(tsFilePath);
      }

      await triggerSync();

      return { success: true, message: `Model ${name} deleted` };
    }
  );

  // DELETE /_admin/models/:name/data
  fastify.delete<{ Params: { name: string } }>(
    '/models/:name/data',
    {
      schema: {
        tags: ['Admin - Models'],
        description: 'Clear all data from a model (truncate table)',
        params: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              count: { type: 'number' },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { name } = req.params;

      // 1. Check if model exists in schema
      const fileName = `${name.toLowerCase()}.json`;
      const filePath = path.join(alliumDir, 'models', fileName);

      if (!(await fs.pathExists(filePath))) {
        return reply.code(404).send({ error: 'Model definition not found' });
      }

      // 2. Access Prisma delegate dynamically
      // Prisma client properties are usually lowercase (e.g. prisma.user)
      // But we should try both or rely on standard naming convention
      const modelName = name.charAt(0).toLowerCase() + name.slice(1);
      const delegate = (fastify as any).prisma[modelName];

      if (!delegate) {
        return reply.code(500).send({
          error: `Database model '${modelName}' not found in Prisma client. Try syncing the schema first.`,
        });
      }

      try {
        // 3. Delete all records
        const result = await delegate.deleteMany({});
        return {
          success: true,
          message: `Cleared data for model ${name}`,
          count: result.count,
        };
      } catch (error: any) {
        fastify.log.error(error);
        return reply.code(500).send({
          error: `Failed to clear data: ${error.message}`,
        });
      }
    }
  );

  // POST /_admin/models/import
  fastify.post<{
    Body: {
      models: any[];
      strategy: 'skip' | 'overwrite';
    };
  }>(
    '/models/import',
    {
      schema: {
        tags: ['Admin - Models'],
        description: 'Import multiple models from a JSON schema',
        body: {
          type: 'object',
          required: ['models'],
          properties: {
            models: {
              type: 'array',
              description: 'Array of model definitions to import',
              items: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  fields: { type: 'array' },
                  relations: { type: 'array' },
                },
              },
            },
            strategy: {
              type: 'string',
              enum: ['skip', 'overwrite'],
              default: 'skip',
              description:
                'How to handle existing models: skip (ignore) or overwrite',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              imported: { type: 'number' },
              skipped: { type: 'number' },
              errors: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    error: { type: 'string' },
                  },
                },
              },
            },
          },
          400: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { models, strategy = 'skip' } = req.body;

      if (!models || !Array.isArray(models) || models.length === 0) {
        return reply.code(400).send({ error: 'No models provided for import' });
      }

      let imported = 0;
      let skipped = 0;
      const errors: Array<{ name: string; error: string }> = [];

      await fs.ensureDir(path.join(alliumDir, 'models'));
      await fs.ensureDir(modelsDir);

      for (const model of models) {
        if (!model.name) {
          errors.push({ name: 'unknown', error: 'Model name is required' });
          continue;
        }

        const modelName = model.name;
        const fileName = `${modelName.toLowerCase()}.json`;
        const filePath = path.join(alliumDir, 'models', fileName);
        const tsFilePath = path.join(
          modelsDir,
          `${modelName.toLowerCase()}.model.ts`
        );

        try {
          const exists = await fs.pathExists(filePath);

          if (exists && strategy === 'skip') {
            skipped++;
            continue;
          }

          // Write JSON definition
          const modelDef = {
            name: modelName,
            fields: model.fields || [],
            relations: model.relations || [],
            api: model.api,
            service: model.service,
            softDelete: model.softDelete,
            auditTrail: model.auditTrail,
            draftPublish: model.draftPublish,
            constraints: model.constraints,
            description: model.description,
            routes: model.routes || {
              create: { path: `/${modelName.toLowerCase()}` },
              read: { path: `/${modelName.toLowerCase()}/:id` },
              update: { path: `/${modelName.toLowerCase()}/:id` },
              delete: { path: `/${modelName.toLowerCase()}/:id` },
              list: { path: `/${modelName.toLowerCase()}` },
            },
          };

          await fs.writeJson(filePath, modelDef, { spaces: 2 });

          // Create TS file if it doesn't exist
          if (!(await fs.pathExists(tsFilePath))) {
            const tsContent = `import { registerModel } from '@allium/core';

export const ${modelName} = registerModel('${modelName}', {
  // Add hooks here
});
`;
            await fs.writeFile(tsFilePath, tsContent);
          }

          imported++;
        } catch (error: any) {
          errors.push({ name: modelName, error: error.message });
        }
      }

      // Trigger sync after all models are imported
      if (imported > 0) {
        try {
          await triggerSync();
        } catch (error: any) {
          fastify.log.error({ error }, 'Sync failed after import');
        }
      }

      return { success: true, imported, skipped, errors };
    }
  );
}

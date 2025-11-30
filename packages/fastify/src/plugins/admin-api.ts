import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import path from 'path';
import fs from 'fs-extra';
import { autoLoadModels } from '@allium/core';

export interface AdminApiOptions {
  modelsDir?: string;
}

const adminApi = async (fastify: FastifyInstance, options: AdminApiOptions) => {
  // Only enable in development mode
  if (process.env.NODE_ENV && process.env.NODE_ENV !== 'development') {
    fastify.log.info('Admin API disabled (not in development mode)');
    return;
  }

  fastify.log.info('Admin API enabled at /_admin');

  const projectRoot = process.cwd();
  const modelsDir =
    options.modelsDir || path.join(projectRoot, 'src', 'models');
  const alliumDir = path.join(projectRoot, '.allium');

  // Helper to trigger sync (placeholder for now)
  const triggerSync = async () => {
    // In a real implementation, this might spawn 'allium sync'
    // For now, we rely on the user or a file watcher to trigger it
    fastify.log.info('Schema changed. Sync might be required.');
  };

  fastify.register(
    async (routes) => {
      // GET /_admin/config
      routes.get(
        '/config',
        {
          schema: {
            tags: ['Admin'],
            description: 'Get project configuration',
            response: {
              200: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  version: { type: 'string' },
                  root: { type: 'string' },
                },
              },
            },
          },
        },
        async () => {
          const pkg = await fs
            .readJson(path.join(projectRoot, 'package.json'))
            .catch(() => ({}));
          return {
            name: pkg.name,
            version: pkg.version,
            root: projectRoot,
          };
        }
      );

      // GET /_admin/types
      routes.get(
        '/types',
        {
          schema: {
            tags: ['Admin'],
            description: 'List available data types',
            response: {
              200: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
        },
        async () => {
          return ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json'];
        }
      );

      // GET /_admin/relationships
      routes.get(
        '/relationships',
        {
          schema: {
            tags: ['Admin'],
            description: 'List available relationship types',
            response: {
              200: {
                type: 'array',
                items: { type: 'string' },
              },
            },
          },
        },
        async () => {
          return ['1:1', '1:n', 'n:m', 'polymorphic'];
        }
      );

      // GET /_admin/models
      routes.get(
        '/models',
        {
          schema: {
            tags: ['Admin'],
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

      // POST /_admin/models (Create Model)
      routes.post<{ Body: { name: string; fields: any[] } }>(
        '/models',
        {
          schema: {
            tags: ['Admin'],
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
    },
    { prefix: '/_admin' }
  );
};

export default fp(adminApi, {
  name: 'admin-api',
  dependencies: ['swagger'],
});

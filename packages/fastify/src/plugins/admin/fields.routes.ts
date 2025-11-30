import { FastifyInstance } from 'fastify';
import path from 'path';
import fs from 'fs-extra';

export async function registerFieldsRoutes(
  fastify: FastifyInstance,
  alliumDir: string,
  triggerSync: () => Promise<void>
) {
  // POST /_admin/models/:name/fields
  fastify.post<{ Params: { name: string }; Body: any }>(
    '/models/:name/fields',
    {
      schema: {
        tags: ['Admin - Fields'],
        description: 'Add a field to a model',
        params: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
          required: ['name'],
        },
        body: {
          type: 'object',
          required: ['name', 'type'],
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
            required: { type: 'boolean' },
            unique: { type: 'boolean' },
            default: {},
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
      model.fields = model.fields || [];
      model.fields.push(req.body);

      await fs.writeJson(filePath, model, { spaces: 2 });
      await triggerSync();

      return { success: true, model };
    }
  );

  // PUT /_admin/models/:name/fields/:fieldName
  fastify.put<{ Params: { name: string; fieldName: string }; Body: any }>(
    '/models/:name/fields/:fieldName',
    {
      schema: {
        tags: ['Admin - Fields'],
        description: 'Update a field in a model',
        params: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            fieldName: { type: 'string' },
          },
          required: ['name', 'fieldName'],
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string' },
            required: { type: 'boolean' },
            unique: { type: 'boolean' },
            default: {},
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
      const { name, fieldName } = req.params;
      const fileName = `${name.toLowerCase()}.json`;
      const filePath = path.join(alliumDir, 'models', fileName);

      if (!(await fs.pathExists(filePath))) {
        return reply.code(404).send({ error: 'Model not found' });
      }

      const model = await fs.readJson(filePath);
      const fieldIndex = model.fields?.findIndex(
        (f: any) => f.name === fieldName
      );

      if (fieldIndex === -1 || fieldIndex === undefined) {
        return reply.code(404).send({ error: 'Field not found' });
      }

      const updates = req.body as Record<string, any>;
      model.fields[fieldIndex] = {
        ...model.fields[fieldIndex],
        ...updates,
      };

      await fs.writeJson(filePath, model, { spaces: 2 });
      await triggerSync();

      return { success: true, model };
    }
  );

  // DELETE /_admin/models/:name/fields/:fieldName
  fastify.delete<{ Params: { name: string; fieldName: string } }>(
    '/models/:name/fields/:fieldName',
    {
      schema: {
        tags: ['Admin - Fields'],
        description: 'Remove a field from a model',
        params: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            fieldName: { type: 'string' },
          },
          required: ['name', 'fieldName'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              model: { type: 'object' },
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
      const { name, fieldName } = req.params;
      const fileName = `${name.toLowerCase()}.json`;
      const filePath = path.join(alliumDir, 'models', fileName);

      if (!(await fs.pathExists(filePath))) {
        return reply.code(404).send({ error: 'Model not found' });
      }

      const model = await fs.readJson(filePath);
      model.fields = model.fields?.filter((f: any) => f.name !== fieldName);

      await fs.writeJson(filePath, model, { spaces: 2 });
      await triggerSync();

      return { success: true, model };
    }
  );
}

import { FastifyInstance } from 'fastify';
import path from 'path';
import fs from 'fs-extra';

export async function registerRelationsRoutes(
  fastify: FastifyInstance,
  alliumDir: string,
  triggerSync: () => Promise<void>
) {
  // POST /_admin/models/:name/relations
  fastify.post<{ Params: { name: string }; Body: any }>(
    '/models/:name/relations',
    {
      schema: {
        tags: ['Admin - Relations'],
        description: 'Add a relationship to a model',
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
            type: {
              type: 'string',
              enum: ['1:1', '1:n', 'n:m', 'polymorphic'],
            },
            model: { type: 'string' },
            models: { type: 'array', items: { type: 'string' } },
            foreignKey: { type: 'string' },
            required: { type: 'boolean' },
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
      model.relations = model.relations || [];
      model.relations.push(req.body);

      await fs.writeJson(filePath, model, { spaces: 2 });
      await triggerSync();

      return { success: true, model };
    }
  );

  // PUT /_admin/models/:name/relations/:relationName
  fastify.put<{ Params: { name: string; relationName: string }; Body: any }>(
    '/models/:name/relations/:relationName',
    {
      schema: {
        tags: ['Admin - Relations'],
        description: 'Update a relationship in a model',
        params: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            relationName: { type: 'string' },
          },
          required: ['name', 'relationName'],
        },
        body: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: {
              type: 'string',
              enum: ['1:1', '1:n', 'n:m', 'polymorphic'],
            },
            model: { type: 'string' },
            models: { type: 'array', items: { type: 'string' } },
            foreignKey: { type: 'string' },
            required: { type: 'boolean' },
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
      const { name, relationName } = req.params;
      const fileName = `${name.toLowerCase()}.json`;
      const filePath = path.join(alliumDir, 'models', fileName);

      if (!(await fs.pathExists(filePath))) {
        return reply.code(404).send({ error: 'Model not found' });
      }

      const model = await fs.readJson(filePath);
      const relationIndex = model.relations?.findIndex(
        (r: any) => r.name === relationName
      );

      if (relationIndex === -1 || relationIndex === undefined) {
        return reply.code(404).send({ error: 'Relationship not found' });
      }

      const updates = req.body as Record<string, any>;
      model.relations[relationIndex] = {
        ...model.relations[relationIndex],
        ...updates,
      };

      await fs.writeJson(filePath, model, { spaces: 2 });
      await triggerSync();

      return { success: true, model };
    }
  );

  // DELETE /_admin/models/:name/relations/:relationName
  fastify.delete<{ Params: { name: string; relationName: string } }>(
    '/models/:name/relations/:relationName',
    {
      schema: {
        tags: ['Admin - Relations'],
        description: 'Remove a relationship from a model',
        params: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            relationName: { type: 'string' },
          },
          required: ['name', 'relationName'],
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
      const { name, relationName } = req.params;
      const fileName = `${name.toLowerCase()}.json`;
      const filePath = path.join(alliumDir, 'models', fileName);

      if (!(await fs.pathExists(filePath))) {
        return reply.code(404).send({ error: 'Model not found' });
      }

      const model = await fs.readJson(filePath);
      model.relations = model.relations?.filter(
        (r: any) => r.name !== relationName
      );

      await fs.writeJson(filePath, model, { spaces: 2 });
      await triggerSync();

      return { success: true, model };
    }
  );
}

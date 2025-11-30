import { FastifyInstance } from 'fastify';
import path from 'path';
import fs from 'fs-extra';

export async function registerSchemaRoutes(
  fastify: FastifyInstance,
  alliumDir: string,
  triggerSync: () => Promise<void>
) {
  // POST /_admin/sync
  fastify.post(
    '/sync',
    {
      schema: {
        tags: ['Admin - Schema'],
        description: 'Trigger schema synchronization',
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async () => {
      await triggerSync();
      return { success: true, message: 'Schema sync triggered' };
    }
  );

  // GET /_admin/schema
  fastify.get(
    '/schema',
    {
      schema: {
        tags: ['Admin - Schema'],
        description: 'Get the generated Prisma schema',
        response: {
          200: {
            type: 'object',
            properties: {
              schema: { type: 'string' },
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
      const schemaPath = path.join(alliumDir, 'prisma', 'schema.prisma');

      if (!(await fs.pathExists(schemaPath))) {
        return reply
          .code(404)
          .send({ error: 'Schema not found. Run sync first.' });
      }

      const schema = await fs.readFile(schemaPath, 'utf-8');
      return { schema };
    }
  );

  // GET /_admin/schema/status
  fastify.get(
    '/schema/status',
    {
      schema: {
        tags: ['Admin - Schema'],
        description: 'Check if schema is in sync',
        response: {
          200: {
            type: 'object',
            properties: {
              inSync: { type: 'boolean' },
              schemaExists: { type: 'boolean' },
              modelsCount: { type: 'integer' },
            },
          },
        },
      },
    },
    async () => {
      const schemaPath = path.join(alliumDir, 'prisma', 'schema.prisma');
      const schemaJsonPath = path.join(alliumDir, 'schema.json');

      const schemaExists = await fs.pathExists(schemaPath);
      const schemaJsonExists = await fs.pathExists(schemaJsonPath);

      let modelsCount = 0;
      if (schemaJsonExists) {
        const schemaJson = await fs.readJson(schemaJsonPath);
        modelsCount = schemaJson.models?.length || 0;
      }

      return {
        inSync: schemaExists && schemaJsonExists,
        schemaExists,
        modelsCount,
      };
    }
  );
}

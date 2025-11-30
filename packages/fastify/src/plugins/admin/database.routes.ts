import { FastifyInstance } from 'fastify';
import path from 'path';
import fs from 'fs-extra';
import { exec } from 'child_process';
import util from 'util';

const execAsync = util.promisify(exec);

export async function registerDatabaseRoutes(
  fastify: FastifyInstance,
  alliumDir: string
) {
  // POST /_admin/db/seed
  fastify.post(
    '/db/seed',
    {
      schema: {
        tags: ['Admin - Database'],
        description: 'Trigger database seeding (npx prisma db seed)',
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              output: { type: 'string' },
            },
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              details: { type: 'string' },
            },
          },
        },
      },
    },
    async (req, reply) => {
      try {
        fastify.log.info('Running database seed...');
        const { stdout } = await execAsync('npx prisma db seed');
        return {
          success: true,
          message: 'Database seeded successfully',
          output: stdout,
        };
      } catch (error: any) {
        fastify.log.error({ error }, 'Failed to seed database');
        return reply.code(500).send({
          error: 'Failed to seed database',
          details: error.message,
        });
      }
    }
  );

  // POST /_admin/db/reset
  fastify.post(
    '/db/reset',
    {
      schema: {
        tags: ['Admin - Database'],
        description: 'Reset database (npx prisma migrate reset --force)',
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
              output: { type: 'string' },
            },
          },
          500: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              details: { type: 'string' },
            },
          },
        },
      },
    },
    async (req, reply) => {
      try {
        fastify.log.info('Resetting database...');
        // --force skips the interactive confirmation
        const { stdout } = await execAsync('npx prisma migrate reset --force');
        return {
          success: true,
          message: 'Database reset successfully',
          output: stdout,
        };
      } catch (error: any) {
        fastify.log.error({ error }, 'Failed to reset database');
        return reply.code(500).send({
          error: 'Failed to reset database',
          details: error.message,
        });
      }
    }
  );

  // GET /_admin/db/stats
  fastify.get(
    '/db/stats',
    {
      schema: {
        tags: ['Admin - Database'],
        description: 'Get record counts for all models',
        response: {
          200: {
            type: 'object',
            properties: {
              stats: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    model: { type: 'string' },
                    count: { type: 'integer' },
                  },
                },
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
      const schemaPath = path.join(alliumDir, 'schema.json');
      if (!(await fs.pathExists(schemaPath))) {
        return reply
          .code(404)
          .send({ error: 'Schema not found. Run sync first.' });
      }

      const schema = await fs.readJson(schemaPath);
      const models = schema.models || [];
      const stats = [];

      for (const model of models) {
        const modelName = model.name;
        // Prisma client usually exposes models as camelCase property
        // e.g. User -> prisma.user
        const prismaModelName =
          modelName.charAt(0).toLowerCase() + modelName.slice(1);
        const prismaClient = fastify.prisma as any;

        if (prismaClient[prismaModelName]) {
          try {
            const count = await prismaClient[prismaModelName].count();
            stats.push({ model: modelName, count });
          } catch (e) {
            fastify.log.warn(`Failed to count ${modelName}: ${e}`);
            stats.push({ model: modelName, count: -1 });
          }
        } else {
          // Try PascalCase just in case or skip
          if (prismaClient[modelName]) {
            const count = await prismaClient[modelName].count();
            stats.push({ model: modelName, count });
          }
        }
      }

      // Also check for ApiKey model specifically if not in schema.json (it's internal)
      if (fastify.prisma.apiKey) {
        const count = await fastify.prisma.apiKey.count();
        stats.push({ model: 'ApiKey', count });
      }

      return { stats };
    }
  );
}

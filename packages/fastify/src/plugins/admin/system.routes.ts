import { FastifyInstance } from 'fastify';
import os from 'os';

export async function registerSystemRoutes(fastify: FastifyInstance) {
  // GET /_admin/system/info
  fastify.get(
    '/system/info',
    {
      schema: {
        tags: ['Admin - System'],
        description: 'Get system information and health status',
        response: {
          200: {
            type: 'object',
            properties: {
              os: {
                type: 'object',
                properties: {
                  platform: { type: 'string' },
                  release: { type: 'string' },
                  type: { type: 'string' },
                  arch: { type: 'string' },
                  cpus: { type: 'integer' },
                  totalMem: { type: 'integer' },
                  freeMem: { type: 'integer' },
                },
              },
              node: {
                type: 'object',
                properties: {
                  version: { type: 'string' },
                  env: { type: 'string' },
                  uptime: { type: 'number' },
                  memoryUsage: {
                    type: 'object',
                    properties: {
                      rss: { type: 'integer' },
                      heapTotal: { type: 'integer' },
                      heapUsed: { type: 'integer' },
                      external: { type: 'integer' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    async () => {
      const memUsage = process.memoryUsage();

      return {
        os: {
          platform: os.platform(),
          release: os.release(),
          type: os.type(),
          arch: os.arch(),
          cpus: os.cpus().length,
          totalMem: os.totalmem(),
          freeMem: os.freemem(),
        },
        node: {
          version: process.version,
          env: process.env.NODE_ENV || 'development',
          uptime: process.uptime(),
          memoryUsage: {
            rss: memUsage.rss,
            heapTotal: memUsage.heapTotal,
            heapUsed: memUsage.heapUsed,
            external: memUsage.external,
          },
        },
      };
    }
  );
}

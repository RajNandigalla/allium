import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';

export default fp(
  async (fastify: FastifyInstance) => {
    fastify.addHook('onRequest', async (req, reply) => {
      (req as any).startTime = process.hrtime();
    });

    fastify.addHook('onResponse', async (req, reply) => {
      const startTime = (req as any).startTime;
      if (!startTime) return;

      const [seconds, nanoseconds] = process.hrtime(startTime);
      const durationMs = Math.round(seconds * 1000 + nanoseconds / 1e6);

      const { method, url } = req;
      const statusCode = reply.statusCode;

      // Skip health checks, swagger docs, and favicon
      if (
        url.startsWith('/health') ||
        url.startsWith('/documentation') ||
        url === '/favicon.ico'
      ) {
        return;
      }

      try {
        const prisma = (fastify as any).prisma;

        if (!prisma || !prisma.apiMetric) return;

        // Async write - don't await to avoid blocking
        prisma.apiMetric
          .create({
            data: {
              endpoint: url.split('?')[0], // Remove query params for better aggregation
              method,
              statusCode,
              latency: durationMs,
              timestamp: new Date(),
            },
          })
          .catch((err: any) => {
            // Silently fail or log debug
            // fastify.log.debug({ err }, 'Failed to log analytics');
          });
      } catch (error) {
        // Ignore errors
      }
    });

    fastify.log.info('Analytics plugin registered');
  },
  {
    name: 'analytics-plugin',
    dependencies: ['prisma'],
  }
);

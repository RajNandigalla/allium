import { FastifyPluginAsync } from 'fastify';

const health: FastifyPluginAsync = async (fastify, opts): Promise<void> => {
  fastify.get(
    '/health',
    {
      schema: {
        summary: 'Health check',
        description: 'Check the health of the application and its dependencies',
        tags: ['health'],
        response: {
          200: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              uptime: { type: 'number' },
              checks: {
                type: 'object',
                properties: {
                  database: { type: 'string' },
                  cache: { type: 'string' },
                },
              },
            },
          },
          503: {
            type: 'object',
            properties: {
              status: { type: 'string' },
              timestamp: { type: 'string' },
              uptime: { type: 'number' },
              checks: {
                type: 'object',
                properties: {
                  database: { type: 'string' },
                  cache: { type: 'string' },
                },
              },
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async function (request, reply) {
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        checks: {
          database: 'unknown',
          cache: 'unknown',
        },
      };

      let status: 200 | 503 = 200;

      // Check Database
      try {
        // Try a simple query to verify DB connection
        // Note: $queryRaw works for SQL databases. For MongoDB, we might need a different approach.
        // Using $runCommandRaw for Mongo or just checking connection state if generic.
        // For now, let's assume standard SQL or rely on Prisma's ability to run a raw query.
        // A strictly generic check is hard with Prisma without knowing the provider.
        // We'll try a generic $executeRaw which is often supported or fallback to simple connection check if possible.
        // Actually, simple way: check if we can connect.
        // But to be real 'health', we should run a command.
        // Let's try to query a system table or just SELECT 1.

        // Use an empty query or valid generic one?
        // 'SELECT 1' is standard SQL.
        try {
          await fastify.prisma.$queryRaw`SELECT 1`;
          health.checks.database = 'connected';
        } catch (e) {
          // Logic for Mongo or other non-SQL if needed, or just fail.
          // If it's a "raw query not supported" error, we might assume connection is fine or try a fallback.
          // But let's assume connected if basic call works, or report error.
          health.checks.database = 'disconnected';
          status = 503;
          request.log.error({ err: e }, 'Database health check failed');
        }
      } catch (error) {
        health.checks.database = 'error';
        status = 503;
        request.log.error({ err: error }, 'Database health check error');
      }

      // Check Cache
      if (fastify.cache) {
        if (fastify.cache.isAvailable()) {
          health.checks.cache = 'connected';
        } else {
          health.checks.cache = 'disconnected';
          // Cache might be optional, so maybe don't fail health check?
          // Depends on criticality. Usually critical.
          // If disabled in config, isAvailable might be false?
          // Let's assume if plugin exists, we expect it to work.
          // If expressly disabled, maybe we shouldn't check?
          // But existing code says "Cache plugin disabled" returns early, so fastify.cache won't be decorated or available if disabled?
          // Wait, cache plugin *is* decorated line 56. Even if disabled? No, line 42 return.
          // So if fastify.cache exists, it is enabled.
          health.checks.cache = 'disconnected';
          // status = 503; // Uncomment if cache is critical
        }
      } else {
        health.checks.cache = 'disabled';
      }

      if (status !== 200) {
        health.status = 'error';
      }

      return reply.code(status).send(health);
    }
  );
};

export default health;

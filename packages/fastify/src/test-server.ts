import Fastify from 'fastify';
import { registerModel } from '@allium/core';
import app from './app';

// Define a test model with hooks
const User = registerModel('User', {
  beforeCreate: async (data, context) => {
    context.logger.info('🪝 Hook: beforeCreate executed');
    // Add a timestamp if not present
    if (!data.createdAt) {
      data.createdAt = new Date();
    }
    return data;
  },
  afterCreate: async (result, context) => {
    context.logger.info(`🪝 Hook: afterCreate executed for ID: ${result.id}`);
  },
  beforeFind: async (query, context) => {
    context.logger.info('🪝 Hook: beforeFind executed');
    return query;
  },
});

async function start() {
  const fastify = Fastify({
    logger: {
      level: 'info',
      transport: {
        target: 'pino-pretty',
      },
    },
  });

  // Register the app with configuration
  // Autoload will pick up plugins and pass these options
  await fastify.register(app, {
    models: [User],
    prisma: {
      // Use SQLite for testing
      datasourceUrl: 'file:./test.db',
      provider: 'sqlite',
      log: true,
    },
    routePrefix: '/api',
  });

  try {
    await fastify.listen({ port: 3000 });
    console.log(`
🚀 Server running at http://localhost:3000
📚 Swagger UI at http://localhost:3000/documentation
    `);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

start();

import Fastify, { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import {
  ModelDefinition,
  SchemaIntrospector,
  HookExecutor,
  modelRegistry,
} from '@allium/core';
import { generateRoutes } from './route-generator';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';

export interface AlliumAppConfig {
  /** Registered models */
  models: ModelDefinition[];

  /** Prisma client instance (optional, will create if not provided) */
  prisma?: PrismaClient;

  /** Custom services to inject into hook context */
  services?: Record<string, any>;

  /** Fastify server options */
  fastify?: {
    logger?: boolean | object;
    [key: string]: any;
  };

  /** Enable Swagger documentation */
  swagger?: boolean;

  /** Prisma schema path (optional) */
  schemaPath?: string;
  /** Global API prefix (default: '/api') */
  prefix?: string;
}

/**
 * Create an Allium Fastify application
 *
 * @example
 * ```typescript
 * import { createAlliumApp } from '@allium/fastify';
 * import { Product } from './models/product.model';
 *
 * const app = await createAlliumApp({
 *   models: [Product],
 * });
 *
 * await app.listen({ port: 3000 });
 * ```
 */
export async function createAlliumApp(
  config: AlliumAppConfig
): Promise<FastifyInstance> {
  // Create Fastify instance
  const app = Fastify({
    logger: true,
    ...config.fastify,
  });

  // Initialize Prisma
  const prisma = config.prisma || new PrismaClient();
  app.decorate('prisma', prisma);

  // Introspect Prisma schema and enrich models
  const introspector = new SchemaIntrospector(config.schemaPath);
  const hookExecutor = new HookExecutor();

  app.log.info('Introspecting Prisma schema...');

  for (const model of config.models) {
    try {
      const metadata = await introspector.introspect(model.name);
      model.metadata = metadata;
      app.log.info(`✓ Introspected model: ${model.name}`);
    } catch (error) {
      app.log.error(
        `✗ Failed to introspect model ${model.name}: ${
          (error as Error).message
        }`
      );
      throw error;
    }
  }

  // Setup Swagger if enabled
  if (config.swagger !== false) {
    await app.register(swagger, {
      openapi: {
        info: {
          title: 'Allium API',
          description: 'Auto-generated API documentation',
          version: '1.0.0',
        },
      },
    });

    await app.register(swaggerUi, {
      routePrefix: '/documentation',
    });
  }

  // Generate routes for all models
  app.log.info('Generating routes...');

  for (const model of config.models) {
    generateRoutes(app, model, prisma, hookExecutor, config.services || {}, {
      prefix: config.prefix,
    });
    app.log.info(`✓ Generated routes for: ${model.name}`);
  }

  // Health check endpoint
  app.get('/health', async () => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  // Graceful shutdown
  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  app.log.info('✓ Allium app ready!');

  return app;
}

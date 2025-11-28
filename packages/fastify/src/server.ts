import Fastify, { FastifyServerOptions } from 'fastify';
import { AlliumPluginOptions } from './plugins/allium';
import { PrismaPluginOptions } from './plugins/prisma';
import app from './app';

import { FastifyCorsOptions } from '@fastify/cors';
import { FastifyHelmetOptions } from '@fastify/helmet';
import { RateLimitPluginOptions } from '@fastify/rate-limit';
import { FastifyCompressOptions } from '@fastify/compress';
import { FastifySensibleOptions } from '@fastify/sensible';
import { FastifySwaggerOptions } from '@fastify/swagger';

export interface AlliumServerConfig extends AlliumPluginOptions {
  /**
   * Prisma database configuration (required)
   */
  prisma: PrismaPluginOptions;

  /**
   * Fastify server options
   */
  server?: FastifyServerOptions;

  /**
   * Swagger/OpenAPI documentation configuration
   * @see https://github.com/fastify/fastify-swagger
   */
  swagger?: FastifySwaggerOptions;

  /**
   * CORS configuration
   * @see https://github.com/fastify/fastify-cors
   */
  cors?: FastifyCorsOptions;

  /**
   * Helmet security headers configuration
   * @see https://github.com/fastify/fastify-helmet
   */
  helmet?: FastifyHelmetOptions;

  /**
   * Rate limiting configuration
   * @see https://github.com/fastify/fastify-rate-limit
   */
  rateLimit?: RateLimitPluginOptions;

  /**
   * Compression configuration
   * @see https://github.com/fastify/fastify-compress
   */
  compress?: FastifyCompressOptions;

  /**
   * Sensible plugin configuration
   * @see https://github.com/fastify/fastify-sensible
   */
  sensible?: FastifySensibleOptions;

  /**
   * Any additional plugin configurations
   */
  [key: string]: any;
}

/**
 * Initialize an Allium server with all plugins configured
 * This is a convenience function that wraps the Allium plugin
 *
 * @example
 * ```typescript
 * import { initAllium } from '@allium/fastify';
 * import { autoLoadModels } from '@allium/core';
 * import path from 'path';
 *
 * const models = await autoLoadModels(path.join(__dirname, 'models'));
 *
 * const app = await initAllium({
 *   // Allium configuration
 *   models,
 *   routePrefix: '/api',
 *
 *   // Prisma configuration (required)
 *   prisma: {
 *     datasourceUrl: process.env.DATABASE_URL || 'file:./dev.db'
 *   },
 *
 *   // Optional plugin configurations
 *   swagger: {
 *     mode: 'dynamic',
 *     openapi: {
 *       info: { title: 'My API', version: '1.0.0' }
 *     }
 *   },
 *   cors: {
 *     origin: '*',
 *     credentials: true
 *   },
 *   rateLimit: {
 *     max: 100,
 *     timeWindow: '1 minute'
 *   },
 *
 *   // Fastify server options
 *   server: {
 *     logger: true
 *   }
 * });
 *
 * await app.listen({ port: 3000 });
 * ```
 */
export async function initAllium(config: AlliumServerConfig) {
  const { server, ...alliumConfig } = config;
  const fastify = Fastify(server || { logger: true });
  await fastify.register(app, alliumConfig);
  return fastify;
}

import Fastify, { FastifyServerOptions } from 'fastify';
import alliumPlugin, { AlliumPluginOptions } from './plugins/allium';
import prismaPlugin, { PrismaPluginOptions } from './plugins/prisma';

export interface AlliumServerConfig extends AlliumPluginOptions {
  /**
   * Prisma database configuration
   */
  prisma: PrismaPluginOptions;

  /**
   * Fastify server options
   */
  server?: FastifyServerOptions;
}

/**
 * Create an Allium server with all plugins configured
 * This is a convenience function that wraps the Allium plugin
 *
 * @example
 * ```typescript
 * import { createAlliumApp } from '@allium/fastify';
 * import { User, Post } from './models';
 *
 * const app = await createAlliumApp({
 *   models: [User, Post],
 *   prisma: {
 *     datasourceUrl: process.env.DATABASE_URL,
 *     provider: 'sqlite'
 *   },
 *   server: {
 *     logger: true
 *   }
 * });
 *
 * await app.listen({ port: 3000 });
 * ```
 */
export async function createAlliumApp(config: AlliumServerConfig) {
  const { server, ...alliumConfig } = config;

  // Create Fastify instance
  const app = Fastify(server || { logger: true });

  // Register Prisma plugin first
  await app.register(prismaPlugin, alliumConfig.prisma);

  // Register Allium plugin
  await app.register(alliumPlugin, alliumConfig);

  return app;
}

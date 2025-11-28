import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { ModelDefinition, SchemaIntrospector } from '@allium/core';
import modelSchemasPlugin from '../framework/model-schemas';
import modelRoutesPlugin from '../framework/model-routes';

export interface AlliumPluginOptions {
  /**
   * Array of registered models to generate CRUD routes for
   */
  models: ModelDefinition[];

  // Prisma configuration removed to decouple framework from specific ORM config
  // The plugin now relies on the 'prisma' decorator being present on the Fastify instance

  /**
   * Route prefix for all generated routes
   * @default '/api'
   */
  routePrefix?: string;
}

/**
 * Main Allium plugin
 * Composes sub-plugins to provide full Allium functionality:
 * - Registers Swagger schemas (via model-schemas plugin)
 * - Generates CRUD routes (via model-routes plugin)
 *
 * @example
 * ```typescript
 * import Fastify from 'fastify';
 * import alliumPlugin from '@allium/fastify';
 * import { User, Post } from './models';
 *
 * const app = Fastify();
 *
 * await app.register(alliumPlugin, {
 *   models: [User, Post],
 *   prisma: {
 *     datasourceUrl: process.env.DATABASE_URL,
 *     provider: 'sqlite'
 *   }
 * });
 * ```
 */
export default fp<AlliumPluginOptions>(
  async (fastify: FastifyInstance, opts: AlliumPluginOptions) => {
    const { models, routePrefix = '/api' } = opts;

    fastify.log.info('Initializing Allium plugin...');

    // Validate models array
    if (!models || !Array.isArray(models)) {
      fastify.log.warn(
        'No models provided to Allium plugin. Skipping initialization.'
      );
      return;
    }

    if (models.length === 0) {
      fastify.log.warn(
        'Empty models array provided to Allium plugin. Skipping initialization.'
      );
      return;
    }

    // 0. Introspect models to populate metadata
    // This must be done before registering schemas
    const introspector = new SchemaIntrospector();
    for (const model of models) {
      try {
        model.metadata = await introspector.introspect(model.name);
      } catch (error) {
        fastify.log.warn({ error }, `Could not introspect model ${model.name}`);
      }
    }

    // 1. Register Swagger schemas
    await fastify.register(modelSchemasPlugin, { models });

    // 2. Generate CRUD routes
    await fastify.register(modelRoutesPlugin, { models, routePrefix });

    fastify.log.info(
      `Allium plugin initialized successfully with ${models.length} models`
    );
  },
  {
    name: 'allium-plugin',
    dependencies: ['swagger', 'prisma'],
  }
);

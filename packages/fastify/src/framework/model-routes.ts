import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { ModelDefinition } from '@allium/core';
import { generateModelRoutes } from '../generators/crud-routes';

export interface ModelRoutesPluginOptions {
  /**
   * Array of registered models to generate CRUD routes for
   */
  models: ModelDefinition[];

  /**
   * Route prefix for all generated routes
   * @default '/api'
   */
  routePrefix?: string;
}

/**
 * Plugin to generate CRUD routes for Allium models
 */
export default fp<ModelRoutesPluginOptions>(
  async (fastify: FastifyInstance, opts: ModelRoutesPluginOptions) => {
    const { models, routePrefix = '/api' } = opts;

    // Validate models array
    if (!models || !Array.isArray(models)) {
      fastify.log.warn(
        'No models provided to model-routes plugin. Skipping route generation.'
      );
      return;
    }

    if (models.length === 0) {
      fastify.log.warn(
        'Empty models array provided to model-routes plugin. Skipping route generation.'
      );
      return;
    }

    for (const model of models) {
      await generateModelRoutes(fastify, model, models, { routePrefix });
    }

    fastify.log.info(`Generated CRUD routes for ${models.length} models`);
  },
  {
    name: 'allium-model-routes',
    decorators: {
      fastify: ['prisma'], // Ensure Prisma decorator is present
    },
  }
);

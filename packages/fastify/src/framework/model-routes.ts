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

    for (const model of models) {
      await generateModelRoutes(fastify, model, { routePrefix });
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

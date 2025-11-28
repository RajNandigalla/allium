import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { ModelDefinition } from '@allium/core';
import { registerSwaggerSchemas } from '../generators/swagger-schemas';

export interface ModelSchemasPluginOptions {
  /**
   * Array of registered models to generate Swagger schemas for
   */
  models: ModelDefinition[];
}

/**
 * Plugin to register Swagger schemas for Allium models
 */
export default fp<ModelSchemasPluginOptions>(
  async (fastify: FastifyInstance, opts: ModelSchemasPluginOptions) => {
    const { models } = opts;

    registerSwaggerSchemas(fastify, models);
    fastify.log.info(`Registered Swagger schemas for ${models.length} models`);
  },
  {
    name: 'allium-model-schemas',
    dependencies: ['swagger'],
  }
);

import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import {
  ApiKeyModel,
  ApiMetricModel,
  WebhookModel,
  CronJobModel,
  ModelDefinition,
  SchemaIntrospector,
} from '@allium/core';
import modelSchemasPlugin from '../framework/model-schemas';
import modelRoutesPlugin from '../framework/model-routes';
import apiKeyAuthPlugin, { PublicRouteConfig } from './api-key-auth';
import { generateGraphQLTypeDefs } from '../generators/graphql-generator';
import { generateResolvers } from '../generators/graphql-resolvers';
import { ApolloServer } from '@apollo/server';
import { fastifyApolloHandler } from '@as-integrations/fastify';
import analyticsPlugin from '../framework/analytics';
import webhooksPlugin from '../framework/webhooks';
import cronPlugin from '../framework/cron';

export interface AlliumPluginOptions {
  /**
   * Array of registered models to generate CRUD routes for
   */
  models: ModelDefinition[];

  /**
   * Directory containing model definitions (required for Admin API)
   */
  modelsDir?: string;

  // Prisma configuration removed to decouple framework from specific ORM config
  // The plugin now relies on the 'prisma' decorator being present on the Fastify instance

  /**
   * Route prefix for all generated routes
   * @default '/api'
   */
  routePrefix?: string;

  /**
   * Default API version (e.g., 'v1')
   * Can be overridden per model
   */
  version?: string;

  /**
   * Enable GraphQL support (Apollo Server)
   * @default false
   */
  graphql?: boolean;

  /**
   * API Key authentication configuration
   */
  apiKeyAuth?: {
    /**
     * Enable API key authentication
     * @default false
     */
    enabled?: boolean;

    /**
     * Header name for API key
     * @default 'x-api-key'
     */
    headerName?: string;

    /**
     * Routes that don't require authentication
     * @default ['/health', '/documentation']
     */
    publicRoutes?: (string | PublicRouteConfig)[];

    /**
     * API key prefix
     * @default 'sk_'
     */
    keyPrefix?: string;
  };
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
    let { models } = opts;
    const { routePrefix = '/api' } = opts;

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

    // Inject ApiKey model if API key authentication is enabled
    if (opts.apiKeyAuth?.enabled) {
      // Check if ApiKey model is already in the models array
      const hasApiKeyModel = models.some((m) => m.name === 'ApiKey');

      if (!hasApiKeyModel) {
        fastify.log.info('Injecting built-in ApiKey model for authentication');
        models = [...models, ApiKeyModel];
      }

      // Register API key authentication plugin
      await fastify.register(apiKeyAuthPlugin, opts.apiKeyAuth);
    }

    // Always inject ApiMetric model for analytics
    const hasApiMetricModel = models.some((m) => m.name === 'ApiMetric');
    if (!hasApiMetricModel) {
      fastify.log.info('Injecting built-in ApiMetric model for analytics');
      models = [...models, ApiMetricModel]; // Use spread to create new array
    }

    // Always inject Webhook and CronJob models
    const hasWebhookModel = models.some((m) => m.name === 'Webhook');
    if (!hasWebhookModel) {
      fastify.log.info('Injecting built-in Webhook model');
      models = [...models, WebhookModel];
    }

    const hasCronJobModel = models.some((m) => m.name === 'CronJob');
    if (!hasCronJobModel) {
      fastify.log.info('Injecting built-in CronJob model');
      models = [...models, CronJobModel];
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

    // 2. Register Analytics
    await fastify.register(analyticsPlugin);

    // 3. Register Webhooks and Cron
    await fastify.register(webhooksPlugin);
    await fastify.register(cronPlugin);

    // 4. Generate CRUD routes
    await fastify.register(modelRoutesPlugin, {
      models,
      routePrefix,
      version: opts.version,
    });

    // 3. Initialize GraphQL (Apollo Server)
    if (opts.graphql) {
      try {
        fastify.log.info('Initializing GraphQL support...');

        const typeDefs = generateGraphQLTypeDefs(models);
        const resolvers = generateResolvers(models);

        const apollo = new ApolloServer({
          typeDefs,
          resolvers,
        });

        await apollo.start();

        fastify.route({
          url: '/graphql',
          method: ['GET', 'POST', 'OPTIONS'],
          schema: { hide: true },
          handler: fastifyApolloHandler(apollo, {
            context: async (request, reply) => ({
              prisma: (fastify as any).prisma,
              request,
              reply,
            }),
          }),
        });

        fastify.log.info('GraphQL initialized at /graphql');
      } catch (error) {
        fastify.log.error({ error }, 'Failed to initialize GraphQL support');
      }
    }

    fastify.log.info(
      `Allium plugin initialized successfully with ${models.length} models`
    );
  },
  {
    name: 'allium-plugin',
    dependencies: ['swagger', 'prisma'],
  }
);

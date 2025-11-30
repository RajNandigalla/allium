import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { ModelDefinition, SchemaIntrospector } from '@allium/core';
import modelSchemasPlugin from '../framework/model-schemas';
import modelRoutesPlugin from '../framework/model-routes';
import apiKeyAuthPlugin, { PublicRouteConfig } from './api-key-auth';

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
      const { ApiKeyModel } = await import(
        '@allium/core/dist/models/apikey.js'
      );

      // Check if ApiKey model is already in the models array
      const hasApiKeyModel = models.some((m) => m.name === 'ApiKey');

      if (!hasApiKeyModel) {
        fastify.log.info('Injecting built-in ApiKey model for authentication');
        models = [...models, ApiKeyModel];
      }

      // Register API key authentication plugin
      await fastify.register(apiKeyAuthPlugin, opts.apiKeyAuth);
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
    await fastify.register(modelRoutesPlugin, {
      models,
      routePrefix,
      version: opts.version,
    });

    // 3. Initialize GraphQL (Apollo Server)
    if (opts.graphql) {
      try {
        const { ApolloServer } = await import('@apollo/server');
        const { fastifyApolloHandler } = await import(
          '@as-integrations/fastify'
        );
        const { generateGraphQLTypeDefs } = await import(
          '../generators/graphql-generator.js'
        );
        const { generateResolvers } = await import(
          '../generators/graphql-resolvers.js'
        );

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

    // 4. Initialize Admin API (Development Only)
    if (
      (process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) &&
      opts.modelsDir
    ) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const adminApi = (await import('./admin-api.js')).default;
        await fastify.register(adminApi as any, { modelsDir: opts.modelsDir });
      } catch (error) {
        fastify.log.warn({ error }, 'Failed to initialize Admin API');
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

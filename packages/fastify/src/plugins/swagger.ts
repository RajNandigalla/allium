import fp from 'fastify-plugin';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import { FastifyInstance } from 'fastify';

/**
 * Swagger/OpenAPI documentation plugin
 * Provides automatic API documentation at /documentation
 *
 * @see https://github.com/fastify/fastify-swagger
 * @see https://github.com/fastify/fastify-swagger-ui
 */
export default fp(
  async (fastify: FastifyInstance, opts: any) => {
    // Extract swagger config from opts (if provided)
    const swaggerConfig = opts.swagger || {};

    // Merge with defaults
    const config = {
      mode: swaggerConfig.mode || 'dynamic',
      openapi: swaggerConfig.openapi || {
        openapi: '3.0.0',
        info: {
          title: 'Allium API',
          description: 'Auto-generated REST API with Allium framework',
          version: '1.0.0',
        },
        servers: [
          {
            url: 'http://localhost:3000',
            description: 'Development server',
          },
        ],
        tags: [
          { name: 'health', description: 'Health check endpoints' },
          {
            name: 'Admin - Config',
            description: 'Admin configuration and metadata endpoints',
          },
          {
            name: 'Admin - Models',
            description: 'Model CRUD operations',
          },
          {
            name: 'Admin - Fields',
            description: 'Field management for models',
          },
          {
            name: 'Admin - Relations',
            description: 'Relationship management for models',
          },
          {
            name: 'Admin - Schema',
            description: 'Schema synchronization and inspection',
          },
          {
            name: 'Admin - API Keys',
            description: 'Manage API keys for service authentication',
          },
          {
            name: 'Admin - Data Explorer',
            description: 'Generic CRUD operations for any model',
          },
          {
            name: 'Admin - System',
            description: 'System information and health status',
          },
          {
            name: 'Admin - Analytics',
            description: 'API usage analytics and metrics',
          },
          {
            name: 'Admin - Cache',
            description: 'Cache management and statistics',
          },
        ],
        components: {
          securitySchemes: {
            bearerAuth: {
              type: 'http',
              scheme: 'bearer',
              bearerFormat: 'JWT',
            },
          },
        },
      },
      ...swaggerConfig,
    };

    // Register Swagger
    await fastify.register(swagger, config);

    // Define custom routes for filtered specs
    fastify.get(
      '/documentation/json/public',
      {
        schema: {
          tags: ['Admin - System'],
          description: 'Get Public API OpenAPI specification',
        },
      },
      async () => {
        const spec = fastify.swagger();
        const paths = spec.paths || {};
        const filteredPaths = Object.keys(paths)
          .filter(
            (path) =>
              !path.startsWith('/_admin') &&
              !path.startsWith('/documentation/json')
          )
          .reduce((obj, key) => {
            obj[key] = paths[key];
            return obj;
          }, {} as any);

        const tags = spec.tags || [];
        const filteredTags = tags.filter(
          (tag) => !tag.name.startsWith('Admin')
        );

        return { ...spec, paths: filteredPaths, tags: filteredTags };
      }
    );

    fastify.get(
      '/documentation/json/admin',
      {
        schema: {
          tags: ['Admin - System'],
          description: 'Get Admin API OpenAPI specification',
        },
      },
      async () => {
        const spec = fastify.swagger();
        const paths = spec.paths || {};
        const filteredPaths = Object.keys(paths)
          .filter(
            (path) =>
              path.startsWith('/_admin') ||
              path.startsWith('/documentation/json')
          )
          .reduce((obj, key) => {
            obj[key] = paths[key];
            return obj;
          }, {} as any);

        const tags = spec.tags || [];
        const filteredTags = tags.filter((tag) => tag.name.startsWith('Admin'));

        return { ...spec, paths: filteredPaths, tags: filteredTags };
      }
    );

    // Register Swagger UI with multiple URLs
    await fastify.register(swaggerUI, {
      routePrefix: '/documentation',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
        urls: [
          { url: '/documentation/json/public', name: 'Public API' },
          { url: '/documentation/json/admin', name: 'Admin API' },
        ],
        'urls.primaryName': 'Public API',
      } as any,
      staticCSP: true,
      transformStaticCSP: (header: string) => header,
    });
  },
  { name: 'swagger' }
);

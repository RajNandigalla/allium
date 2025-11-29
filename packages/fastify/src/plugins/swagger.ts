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
        tags: [{ name: 'health', description: 'Health check endpoints' }],
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

    // Register Swagger UI
    await fastify.register(swaggerUI, {
      routePrefix: '/documentation',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
      },
      staticCSP: true,
      transformStaticCSP: (header: string) => header,
    });
  },
  { name: 'swagger' }
);

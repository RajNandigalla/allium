import fp from 'fastify-plugin';
import swagger, { FastifySwaggerOptions } from '@fastify/swagger';
import swaggerUI, { FastifySwaggerUiOptions } from '@fastify/swagger-ui';
import { FastifyInstance } from 'fastify';

/**
 * Swagger/OpenAPI documentation plugin
 * Provides automatic API documentation at /documentation
 *
 * @see https://github.com/fastify/fastify-swagger
 * @see https://github.com/fastify/fastify-swagger-ui
 */
export default fp(
  async (fastify: FastifyInstance) => {
    // Register Swagger
    await fastify.register(swagger, {
      openapi: {
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
          { name: 'models', description: 'Auto-generated model endpoints' },
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
    } as FastifySwaggerOptions);

    // Register Swagger UI
    await fastify.register(swaggerUI, {
      routePrefix: '/documentation',
      uiConfig: {
        docExpansion: 'list',
        deepLinking: true,
      },
      staticCSP: true,
      transformStaticCSP: (header: string) => header,
    } as FastifySwaggerUiOptions);
  },
  { name: 'swagger' }
);

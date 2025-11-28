import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import { FastifyInstance } from 'fastify';

/**
 * Security headers plugin using Helmet
 * Adds various HTTP headers to help protect against common vulnerabilities
 *
 * @see https://github.com/fastify/fastify-helmet
 */
export default fp(async (fastify: FastifyInstance, opts: any) => {
  const helmetConfig = opts.helmet || {};
  await fastify.register(helmet, {
    // Disable contentSecurityPolicy in development for Swagger UI
    contentSecurityPolicy: false,
    // Enable other security headers
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: false,
    crossOriginResourcePolicy: false,
    ...helmetConfig,
  });
});

import fp from 'fastify-plugin';
import cors, { FastifyCorsOptions } from '@fastify/cors';
import { FastifyInstance } from 'fastify';

/**
 * CORS plugin for cross-origin requests
 *
 * @see https://github.com/fastify/fastify-cors
 */
export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(cors, {
    origin: true, // Allow all origins in development
    credentials: true,
  } as FastifyCorsOptions);
});

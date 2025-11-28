import fp from 'fastify-plugin';
import rateLimit, { RateLimitPluginOptions } from '@fastify/rate-limit';
import { FastifyInstance } from 'fastify';

/**
 * Rate limiting plugin to prevent abuse
 * Limits the number of requests per time window
 *
 * @see https://github.com/fastify/fastify-rate-limit
 */
export default fp(async (fastify: FastifyInstance) => {
  await fastify.register(rateLimit, {
    max: 100, // Maximum 100 requests
    timeWindow: '1 minute', // Per 1 minute window
    cache: 10000, // Cache size for tracking IPs
    allowList: ['127.0.0.1'], // Whitelist localhost
    redis: undefined, // Can be configured with Redis for distributed rate limiting
  } as RateLimitPluginOptions);
});

import fp from 'fastify-plugin';
import compress, { FastifyCompressOptions } from '@fastify/compress';
import { FastifyInstance } from 'fastify';

/**
 * Response compression plugin
 * Automatically compresses responses using gzip, deflate, or brotli
 *
 * @see https://github.com/fastify/fastify-compress
 */
export default fp(async (fastify: FastifyInstance, opts: any) => {
  const compressConfig = opts.compress || {};
  await fastify.register(compress, {
    global: true, // Enable compression globally
    threshold: 1024, // Only compress responses larger than 1KB
    encodings: ['br', 'gzip', 'deflate'], // Brotli (br) first for best compression
    ...compressConfig,
  } as FastifyCompressOptions);
});

import fp from 'fastify-plugin';
import sensible, { FastifySensibleOptions } from '@fastify/sensible';
import { FastifyInstance } from 'fastify';

/**
 * This plugins adds some utilities to handle http errors
 *
 * @see https://github.com/fastify/fastify-sensible
 */
export default fp<FastifySensibleOptions>(
  async (fastify: FastifyInstance, opts: any) => {
    const sensibleConfig = opts.sensible || {};
    fastify.register(sensible, sensibleConfig);
  }
);

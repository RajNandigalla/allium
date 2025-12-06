import fp from 'fastify-plugin';
import {
  FastifyInstance,
  FastifyPluginOptions,
  FastifyRequest,
  FastifyReply,
} from 'fastify';
import {
  CacheService,
  CacheServiceOptions,
  generateCacheKey,
} from '@allium/core';
import { minimatch } from 'minimatch';

export interface CachePluginOptions extends FastifyPluginOptions {
  cache?: CacheServiceOptions & {
    ttl?: number;
    excludeRoutes?: string[];
    excludeAuthenticatedRequests?: boolean;
    cachePrivate?: boolean;
    invalidation?: {
      enabled?: boolean;
    };
  };
}

/**
 * Caching plugin for Fastify
 *
 * Features:
 * - Automatic caching of GET requests
 * - Automatic cache invalidation on write operations
 * - Cache management endpoints
 * - Graceful degradation without Redis
 */
export default fp<CachePluginOptions>(
  async (fastify: FastifyInstance, opts: CachePluginOptions) => {
    const cacheConfig = opts.cache;

    if (!cacheConfig || cacheConfig.enabled === false) {
      fastify.log.info('Cache plugin disabled');
      return;
    }

    fastify.log.info('Registering cache plugin...');

    // Create cache service
    const cacheService = new CacheService({
      redis: cacheConfig.redis,
      keyPrefix: cacheConfig.keyPrefix,
      defaultTTL: cacheConfig.ttl,
      enabled: cacheConfig.enabled,
    });

    // Decorate fastify instance with cache service
    fastify.decorate('cache', cacheService);

    const ttl = cacheConfig.ttl;
    const excludeRoutes = cacheConfig.excludeRoutes || [];
    const excludeAuthenticatedRequests =
      cacheConfig.excludeAuthenticatedRequests !== false;
    const cachePrivate = cacheConfig.cachePrivate || false;

    // Pre-handler hook for cache checking
    fastify.addHook(
      'preHandler',
      async (request: FastifyRequest, reply: FastifyReply) => {
        // Only cache GET requests
        if (request.method !== 'GET') {
          return;
        }

        // Check if route should be excluded
        const shouldExclude = excludeRoutes.some((pattern) =>
          minimatch(request.url, pattern)
        );

        if (shouldExclude) {
          return;
        }

        // Skip caching for authenticated requests if configured
        if (excludeAuthenticatedRequests && request.headers.authorization) {
          return;
        }

        // Skip if cache is not available
        if (!cacheService.isAvailable()) {
          return;
        }

        // Generate cache key
        const cacheKey = generateCacheKeyFromRequest(request);

        // Try to get from cache
        const cachedData = await cacheService.get(cacheKey);

        if (cachedData) {
          // Cache hit
          reply.header('X-Cache', 'HIT');
          reply.header(
            'Cache-Control',
            cachePrivate ? 'private' : `public, max-age=${ttl || 300}`
          );

          const etag = generateETag(cachedData);
          reply.header('ETag', etag);

          // Check if client has valid cache
          if (request.headers['if-none-match'] === etag) {
            reply.code(304);
            return reply.send();
          }

          reply.code(200);
          return reply.send(cachedData);
        }

        // Cache miss
        reply.header('X-Cache', 'MISS');

        // Store cache key for onSend hook
        (request as any).cacheKey = cacheKey;
      }
    );

    // OnSend hook for caching responses
    fastify.addHook(
      'onSend',
      async (request: FastifyRequest, reply: FastifyReply, payload) => {
        const cacheKey = (request as any).cacheKey;

        if (!cacheKey || !cacheService.isAvailable()) {
          return payload;
        }

        // Only cache successful GET responses
        if (
          request.method === 'GET' &&
          reply.statusCode >= 200 &&
          reply.statusCode < 300
        ) {
          // Cache the response asynchronously
          cacheService.set(cacheKey, payload, ttl).catch((err) => {
            request.log.warn('Failed to cache response:', err);
          });

          // Add cache headers
          reply.header(
            'Cache-Control',
            cachePrivate ? 'private' : `public, max-age=${ttl || 300}`
          );

          const etag = generateETag(payload);
          reply.header('ETag', etag);
        }

        // Handle cache invalidation for write operations
        if (cacheConfig.invalidation?.enabled !== false) {
          const method = request.method;
          if (
            ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method) &&
            reply.statusCode >= 200 &&
            reply.statusCode < 300
          ) {
            const model = extractModelFromRoute(request.url);
            if (model) {
              invalidateModelCache(cacheService, model, method, request).catch(
                (err) => {
                  request.log.warn('Failed to invalidate cache:', err);
                }
              );
            }
          }
        }

        return payload;
      }
    );

    // Add cache management endpoints
    fastify.get('/_cache/stats', async () => {
      return await cacheService.getStats();
    });

    fastify.post('/_cache/clear', async () => {
      await cacheService.clear();
      return { success: true, message: 'Cache cleared' };
    });

    fastify.delete('/_cache/:pattern', async (request) => {
      const { pattern } = request.params as { pattern: string };
      await cacheService.deletePattern(pattern);
      return {
        success: true,
        message: `Cleared cache for pattern: ${pattern}`,
      };
    });

    // Cleanup on server close
    fastify.addHook('onClose', async () => {
      await cacheService.disconnect();
    });

    fastify.log.info('Cache plugin registered successfully');
  },
  {
    name: 'cache-plugin',
    dependencies: [],
  }
);

// Helper functions
function generateCacheKeyFromRequest(request: FastifyRequest): string {
  const url = request.url;
  const query = request.query as Record<string, any>;

  const pathParts = url.split('/').filter(Boolean);
  const model = pathParts[pathParts.length - 1]?.split('?')[0] || 'unknown';

  const id = request.params && (request.params as any).id;

  return generateCacheKey({
    model,
    operation: id ? 'get' : 'list',
    id,
    filters: query.filters as any,
    sort: query.sort as any,
    page: query.page ? Number(query.page) : undefined,
    limit: query.limit ? Number(query.limit) : undefined,
  });
}

function generateETag(data: any): string {
  const str = typeof data === 'string' ? data : JSON.stringify(data);
  let hash = 0;

  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }

  return `"${Math.abs(hash).toString(36)}"`;
}

function extractModelFromRoute(route: string): string | null {
  const path = route.split('?')[0];
  const parts = path.split('/').filter(Boolean);

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part === 'api' || part.match(/^v\d+$/)) {
      continue;
    }
    if (part.startsWith(':')) {
      continue;
    }
    return part;
  }

  return null;
}

async function invalidateModelCache(
  cache: CacheService,
  model: string,
  method: string,
  request: FastifyRequest
): Promise<void> {
  const { generateKeyPattern } = await import('@allium/core');

  switch (method) {
    case 'POST':
      await cache.deletePattern(generateKeyPattern(model, 'list'));
      await cache.deletePattern(generateKeyPattern(model, 'count'));
      break;

    case 'PUT':
    case 'PATCH':
      const id = (request.params as any)?.id;
      if (id) {
        await cache.delete(`${model}:get:${id}`);
      }
      await cache.deletePattern(generateKeyPattern(model, 'list'));
      await cache.deletePattern(generateKeyPattern(model, 'count'));
      break;

    case 'DELETE':
      const deleteId = (request.params as any)?.id;
      if (deleteId) {
        await cache.delete(`${model}:get:${deleteId}`);
      }
      await cache.deletePattern(generateKeyPattern(model, 'list'));
      await cache.deletePattern(generateKeyPattern(model, 'count'));
      break;
  }
}

// Extend Fastify types
declare module 'fastify' {
  interface FastifyInstance {
    cache: CacheService;
  }
}

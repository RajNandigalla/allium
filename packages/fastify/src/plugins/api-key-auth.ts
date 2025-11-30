import { FastifyPluginAsync, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';

export interface PublicRouteConfig {
  path: string;
  method?: string | string[];
}

export interface ApiKeyAuthOptions {
  enabled?: boolean;
  headerName?: string; // Default: 'x-api-key'
  publicRoutes?: (string | PublicRouteConfig)[]; // Routes that don't require authentication
  keyPrefix?: string; // Default: 'sk_'
}

declare module 'fastify' {
  interface FastifyInstance {
    verifyApiKey: (
      request: FastifyRequest,
      reply: FastifyReply
    ) => Promise<void>;
  }

  interface FastifyRequest {
    apiKey?: {
      id: string;
      service: string;
      name: string;
    };
  }
}

const apiKeyAuthPlugin: FastifyPluginAsync<ApiKeyAuthOptions> = async (
  fastify,
  opts
) => {
  const options = {
    enabled: opts.enabled ?? false,
    headerName: opts.headerName ?? 'x-api-key',
    publicRoutes: opts.publicRoutes ?? ['/health', '/documentation'],
    keyPrefix: opts.keyPrefix ?? 'sk_',
  };

  if (!options.enabled) {
    fastify.log.info('API Key authentication is disabled');
    return;
  }

  fastify.log.info('Registering API Key authentication plugin');

  // Decorator to verify API key
  fastify.decorate(
    'verifyApiKey',
    async function (request: FastifyRequest, reply: FastifyReply) {
      const apiKey = request.headers[options.headerName] as string;

      if (!apiKey) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'API key is required',
        });
      }

      try {
        // Check if ApiKey model exists (using type assertion for dynamic model)
        const prismaWithApiKey = fastify.prisma as any;

        if (!prismaWithApiKey.apiKey) {
          fastify.log.warn(
            'ApiKey model not found in Prisma. Skipping API key verification.'
          );
          return;
        }

        // Verify the API key
        const keyRecord = await prismaWithApiKey.apiKey.findUnique({
          where: { key: apiKey },
        });

        if (!keyRecord) {
          return reply.status(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'Invalid API key',
          });
        }

        if (!keyRecord.isActive) {
          return reply.status(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'API key is inactive',
          });
        }

        if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
          return reply.status(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'API key has expired',
          });
        }

        // Update last used timestamp (async, don't await to avoid slowing down requests)
        prismaWithApiKey.apiKey
          .update({
            where: { id: keyRecord.id },
            data: { lastUsedAt: new Date() },
          })
          .catch((err: Error) => {
            fastify.log.error({ err }, 'Failed to update lastUsedAt');
          });

        // Attach API key info to request
        request.apiKey = {
          id: keyRecord.id,
          service: keyRecord.service,
          name: keyRecord.name,
        };

        fastify.log.debug(
          `Request authenticated with API key for service: ${keyRecord.service}`
        );
      } catch (error) {
        fastify.log.error(error);
        return reply.status(500).send({
          statusCode: 500,
          error: 'Internal Server Error',
          message: 'Failed to verify API key',
        });
      }
    }
  );

  // Global preHandler hook to check API keys
  fastify.addHook('preHandler', async (request, reply) => {
    // Skip authentication for public routes
    const isPublicRoute = options.publicRoutes.some((route) => {
      if (typeof route === 'string') {
        return request.url.startsWith(route);
      } else {
        const pathMatches = request.url.startsWith(route.path);
        if (!pathMatches) return false;

        if (!route.method) return true;

        const methods = Array.isArray(route.method)
          ? route.method
          : [route.method];
        return methods.includes(request.method);
      }
    });

    if (isPublicRoute) {
      return;
    }

    // Skip for Swagger/OpenAPI routes
    if (
      request.url.startsWith('/documentation') ||
      request.url.startsWith('/swagger')
    ) {
      return;
    }

    await fastify.verifyApiKey(request, reply);
  });

  fastify.log.info('API Key authentication plugin registered successfully');
};

export default fp(apiKeyAuthPlugin, {
  name: 'api-key-auth',
  dependencies: ['prisma'],
});

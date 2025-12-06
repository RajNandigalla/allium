import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import fastifyCsrf from '@fastify/csrf-protection';
import fastifyCookie from '@fastify/cookie';

export interface CSRFProtectionOptions {
  /**
   * Enable CSRF protection
   * @default false
   */
  enabled?: boolean;

  /**
   * Cookie options for CSRF token
   */
  cookieOpts?: {
    signed?: boolean;
    httpOnly?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    secure?: boolean;
    path?: string;
    domain?: string;
  };

  /**
   * Routes that are exempt from CSRF protection
   * Supports glob patterns (e.g., '/api/webhooks/*', '/api/public/*')
   */
  exemptRoutes?: string[];

  /**
   * Session key for storing CSRF token (for session-based tokens)
   * If not provided, uses double-submit cookie pattern
   */
  sessionKey?: string;

  /**
   * Custom secret for signing cookies
   * If not provided, a random secret will be generated
   */
  cookieSecret?: string;
}

/**
 * Check if a route matches any pattern in the exempt list
 */
function isRouteExempt(url: string, exemptRoutes: string[]): boolean {
  for (const pattern of exemptRoutes) {
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    if (regex.test(url)) {
      return true;
    }
  }
  return false;
}

/**
 * CSRF protection plugin
 *
 * Provides CSRF token generation and validation to protect against
 * Cross-Site Request Forgery attacks.
 *
 * Usage:
 * 1. Frontend fetches token from GET /api/csrf-token
 * 2. Frontend includes token in x-csrf-token header for state-changing requests
 * 3. Backend validates token automatically
 *
 * @see https://github.com/fastify/fastify-csrf-protection
 */
export default fp<CSRFProtectionOptions>(
  async (fastify: FastifyInstance, opts: CSRFProtectionOptions) => {
    const {
      enabled = false,
      cookieOpts = {},
      exemptRoutes = [],
      cookieSecret,
    } = opts;

    // If not enabled, skip registration
    if (!enabled) {
      fastify.log.info('CSRF protection is disabled');
      return;
    }

    fastify.log.info('Registering CSRF protection...');

    // Register cookie plugin (required for CSRF)
    await fastify.register(fastifyCookie, {
      secret: cookieSecret || generateRandomSecret(),
    });

    // Register CSRF protection
    await fastify.register(fastifyCsrf, {
      cookieOpts: {
        signed: true,
        httpOnly: true,
        sameSite: 'strict',
        ...cookieOpts,
      },
      sessionPlugin: '@fastify/cookie', // Use cookie-based CSRF tokens
    });

    // Add CSRF token generation endpoint
    fastify.get('/api/csrf-token', async (request, reply) => {
      const token = await reply.generateCsrf();
      return { csrfToken: token };
    });

    // Add CSRF validation hook for state-changing methods
    fastify.addHook('preHandler', async (request, reply) => {
      // Skip for safe methods (GET, HEAD, OPTIONS)
      if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
        return;
      }

      // Skip for exempt routes
      if (isRouteExempt(request.url, exemptRoutes)) {
        return;
      }

      // Skip for CSRF token endpoint itself
      if (request.url === '/api/csrf-token') {
        return;
      }

      // Skip for documentation routes
      if (
        request.url.startsWith('/documentation') ||
        request.url.startsWith('/swagger')
      ) {
        return;
      }

      // Validate CSRF token
      try {
        await reply.csrfProtection(request);
      } catch (error) {
        fastify.log.warn(
          {
            url: request.url,
            method: request.method,
            ip: request.ip,
          },
          'CSRF validation failed'
        );

        throw fastify.httpErrors.forbidden('Invalid CSRF token');
      }
    });

    fastify.log.info('CSRF protection registered successfully');
  },
  {
    name: 'csrf-protection',
    dependencies: ['@fastify/sensible'],
  }
);

/**
 * Generate a random secret for cookie signing
 */
function generateRandomSecret(): string {
  const crypto = require('crypto');
  return crypto.randomBytes(32).toString('hex');
}

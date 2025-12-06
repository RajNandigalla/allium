import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import { FastifyInstance } from 'fastify';

export interface HelmetPluginOptions {
  /**
   * Custom helmet configuration
   * @see https://github.com/fastify/fastify-helmet
   */
  helmet?: any;

  /**
   * Enable production-ready security headers
   * @default true in production, false in development
   */
  enableProductionDefaults?: boolean;
}

/**
 * Security headers plugin using Helmet
 * Adds various HTTP headers to help protect against common vulnerabilities
 *
 * In production mode, enables:
 * - Content-Security-Policy (CSP)
 * - Strict-Transport-Security (HSTS)
 * - X-Frame-Options
 * - X-Content-Type-Options
 * - Referrer-Policy
 * - Permissions-Policy
 *
 * @see https://github.com/fastify/fastify-helmet
 */
export default fp<HelmetPluginOptions>(
  async (fastify: FastifyInstance, opts: HelmetPluginOptions) => {
    const isProduction = process.env.NODE_ENV === 'production';
    const enableProductionDefaults =
      opts.enableProductionDefaults ?? isProduction;

    // Production-ready defaults
    const productionConfig = {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          fontSrc: ["'self'", 'https:', 'data:'],
          formAction: ["'self'"],
          frameAncestors: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
          objectSrc: ["'none'"],
          scriptSrc: ["'self'"],
          scriptSrcAttr: ["'none'"],
          styleSrc: ["'self'", 'https:', "'unsafe-inline'"], // unsafe-inline needed for some frameworks
          upgradeInsecureRequests: [],
        },
      },
      hsts: {
        maxAge: 31536000, // 1 year
        includeSubDomains: true,
        preload: true,
      },
      frameguard: {
        action: 'deny',
      },
      referrerPolicy: {
        policy: 'strict-origin-when-cross-origin',
      },
      permissionsPolicy: {
        camera: ['none'],
        microphone: ['none'],
        geolocation: ['none'],
        payment: ['none'],
      },
    };

    // Development defaults (more permissive for Swagger UI, etc.)
    const developmentConfig = {
      contentSecurityPolicy: false,
      crossOriginEmbedderPolicy: false,
      crossOriginOpenerPolicy: false,
      crossOriginResourcePolicy: false,
    };

    const helmetConfig = {
      ...(enableProductionDefaults ? productionConfig : developmentConfig),
      ...opts.helmet,
    };

    await fastify.register(helmet, helmetConfig);

    fastify.log.info(
      `Helmet security headers registered (${
        enableProductionDefaults ? 'production' : 'development'
      } mode)`
    );
  }
);

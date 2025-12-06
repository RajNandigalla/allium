import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import {
  createXSSSanitizer,
  XSSSanitizerOptions,
} from '../middleware/xss-sanitizer';
import {
  createSQLInjectionGuard,
  SQLInjectionGuardOptions,
} from '../middleware/sql-injection-guard';

export interface SecurityPluginOptions {
  /**
   * XSS protection configuration
   */
  xss?: XSSSanitizerOptions;

  /**
   * SQL injection detection configuration
   */
  sqlInjectionGuard?: SQLInjectionGuardOptions;
}

/**
 * Main security plugin
 *
 * Orchestrates all security features:
 * - XSS sanitization
 * - SQL injection detection
 *
 * Note: CSRF protection is registered separately via the csrf plugin
 * Note: Security headers are configured via the helmet plugin
 *
 * @example
 * ```typescript
 * await fastify.register(securityPlugin, {
 *   xss: {
 *     enabled: true,
 *     exemptRoutes: ['/api/content/*'],
 *     exemptFields: ['htmlContent', 'richText']
 *   },
 *   sqlInjectionGuard: {
 *     enabled: true,
 *     logOnly: false
 *   }
 * });
 * ```
 */
export default fp<SecurityPluginOptions>(
  async (fastify: FastifyInstance, opts: SecurityPluginOptions) => {
    const { xss, sqlInjectionGuard } = opts;

    fastify.log.info('Registering security plugin...');

    // Register XSS sanitization middleware
    if (xss?.enabled) {
      fastify.log.info('Enabling XSS protection');
      const xssSanitizer = createXSSSanitizer(xss);
      fastify.addHook('preHandler', xssSanitizer);
    }

    // Register SQL injection detection middleware
    if (sqlInjectionGuard?.enabled) {
      fastify.log.info('Enabling SQL injection detection');
      const sqlGuard = createSQLInjectionGuard(sqlInjectionGuard);
      fastify.addHook('preHandler', sqlGuard);
    }

    fastify.log.info('Security plugin registered successfully');
  },
  {
    name: 'security-plugin',
    dependencies: ['sensible'], // Requires sensible for httpErrors
  }
);

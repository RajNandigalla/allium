import Fastify, { FastifyServerOptions } from 'fastify';
import { AlliumPluginOptions } from './plugins/allium';
import { PrismaPluginOptions } from './plugins/prisma';
import app from './app';
import { generatePrismaSchema } from '@allium/core';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

import { FastifyCorsOptions } from '@fastify/cors';
import { FastifyHelmetOptions } from '@fastify/helmet';
import { RateLimitPluginOptions } from '@fastify/rate-limit';
import { FastifyCompressOptions } from '@fastify/compress';
import { FastifySensibleOptions } from '@fastify/sensible';
import { FastifySwaggerOptions } from '@fastify/swagger';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

import FastifyOtelInstrumentation from '@fastify/otel';

import { FastifyPluginAsync, FastifyPluginCallback } from 'fastify';

export interface AlliumServerConfig extends AlliumPluginOptions {
  /**
   * Custom Fastify plugins to register
   * Can be a plugin function or a tuple of [plugin, options]
   */
  plugins?: Array<
    | FastifyPluginAsync
    | FastifyPluginCallback
    | [FastifyPluginAsync | FastifyPluginCallback, any]
  >;

  /**
   * Prisma database configuration (required)
   */
  prisma: PrismaPluginOptions;

  // ... (rest of the interface remains the same, but we need to match the target content)
  /**
   * Fastify server options
   */
  server?: FastifyServerOptions;

  /**
   * Swagger/OpenAPI documentation configuration
   * @see https://github.com/fastify/fastify-swagger
   */
  swagger?: FastifySwaggerOptions;

  /**
   * CORS configuration
   * @see https://github.com/fastify/fastify-cors
   */
  cors?: FastifyCorsOptions;

  /**
   * Helmet security headers configuration
   * @see https://github.com/fastify/fastify-helmet
   */
  helmet?:
    | FastifyHelmetOptions
    | { enableProductionDefaults?: boolean; helmet?: FastifyHelmetOptions };

  /**
   * Rate limiting configuration
   * @see https://github.com/fastify/fastify-rate-limit
   */
  rateLimit?: RateLimitPluginOptions;

  /**
   * Compression configuration
   * @see https://github.com/fastify/fastify-compress
   */
  compress?: FastifyCompressOptions;

  /**
   * Sensible plugin configuration
   * @see https://github.com/fastify/fastify-sensible
   */
  sensible?: FastifySensibleOptions;

  /**
   * Security configuration
   */
  security?: {
    /**
     * XSS protection configuration
     */
    xss?: {
      enabled?: boolean;
      whiteList?: Record<string, string[]>;
      exemptRoutes?: string[];
      exemptFields?: string[];
    };

    /**
     * CSRF protection configuration
     */
    csrf?: {
      enabled?: boolean;
      cookieOpts?: any;
      exemptRoutes?: string[];
      sessionKey?: string;
      cookieSecret?: string;
    };

    /**
     * SQL injection detection configuration
     */
    sqlInjectionGuard?: {
      enabled?: boolean;
      logOnly?: boolean;
    };

    /**
     * Encryption configuration
     */
    encryption?: {
      key?: string;
      keys?: Record<number, string>;
    };
  };

  /**
   * Cache configuration
   */
  cache?: {
    /**
     * Enable/disable caching
     */
    enabled?: boolean;

    /**
     * Redis connection configuration
     */
    redis?: {
      url?: string;
      host?: string;
      port?: number;
      password?: string;
      db?: number;
    };

    /**
     * Default TTL in seconds
     */
    ttl?: number;

    /**
     * Cache key prefix
     */
    keyPrefix?: string;

    /**
     * Routes to exclude from caching (glob patterns)
     */
    excludeRoutes?: string[];

    /**
     * Exclude authenticated requests from caching
     */
    excludeAuthenticatedRequests?: boolean;

    /**
     * Use private cache (Cache-Control: private)
     */
    cachePrivate?: boolean;

    /**
     * Cache invalidation configuration
     */
    invalidation?: {
      enabled?: boolean;
    };
  };

  /**
   * Database connection pool configuration
   */
  database?: {
    connectionPool?: {
      min?: number;
      max?: number;
      idleTimeoutMillis?: number;
      connectionTimeoutMillis?: number;
    };
  };

  /**
   * Any additional plugin configurations
   */
  [key: string]: any;

  /**
   * Logging configuration
   */
  logging?: {
    /**
     * Log level (debug, info, warn, error, fatal)
     * @default 'info'
     */
    level?: string;

    /**
     * Enable pretty printing (requires pino-pretty)
     * @default false (json)
     */
    pretty?: boolean;

    /**
     * Fields to redact from logs
     * @default ['req.headers.authorization', 'req.body.password']
     */
    redact?: string[];
  };

  /**
   * Sentry metadata
   */
  sentry?: {
    dsn: string;
    environment?: string;
    tracesSampleRate?: number;
    profilesSampleRate?: number;
  };

  /**
   * OpenTelemetry configuration
   */
  opentelemetry?: {
    serviceName: string;
    otlpEndpoint?: string;
    /**
     * Prometheus metrics configuration
     */
    metrics?: {
      enabled: boolean;
      /**
       * Port to expose metrics on
       * @default 9464
       */
      port?: number;
      /**
       * Endpoint path for metrics
       * @default '/metrics'
       */
      endpoint?: string;
    };
  };

  /**
   * Automatically generate Prisma schema and sync database on startup
   * @default false
   */
  autoSync?: boolean;
}

/**
 * Initialize an Allium server with all plugins configured
 * This is a convenience function that wraps the Allium plugin
 *
 * @example
 * ```typescript
 * import { initAllium } from '@allium/fastify';
 * import { autoLoadModels } from '@allium/core';
 * import path from 'path';
 * import customRoutes from './routes/custom';
 *
 * const models = await autoLoadModels(path.join(__dirname, 'models'));
 *
 * const app = await initAllium({
 *   // Allium configuration
 *   models,
 *   routePrefix: '/api',
 *
 *   // Custom plugins/routes
 *   plugins: [
 *     customRoutes,
 *     [require('@fastify/websocket'), { options: 'here' }]
 *   ],
 *
 *   // Prisma configuration (required)
 *   prisma: {
 *     datasourceUrl: process.env.DATABASE_URL || 'file:./test.db'
 *   },
 *
 *   // ... other config
 * });
 *
 * await app.listen({ port: 3000 });
 * ```
 */
export async function initAllium(config: AlliumServerConfig) {
  const { server, autoSync, plugins, ...alliumConfig } = config;

  // Default modelsDir if not provided (required for Admin API)
  if (!alliumConfig.modelsDir) {
    alliumConfig.modelsDir = path.join(process.cwd(), 'src', 'models');
  }

  if (autoSync) {
    await syncDatabase(config);
  }

  // Initialize Sentry
  if (alliumConfig.sentry) {
    Sentry.init({
      dsn: alliumConfig.sentry.dsn,
      environment: alliumConfig.sentry.environment || 'development',
      tracesSampleRate: alliumConfig.sentry.tracesSampleRate ?? 1.0,
      profilesSampleRate: alliumConfig.sentry.profilesSampleRate ?? 1.0,
      integrations: [nodeProfilingIntegration()],
    });
  }

  // Initialize OpenTelemetry
  if (alliumConfig.opentelemetry) {
    // Configure Metrics (Prometheus)
    let metricReader;
    if (alliumConfig.opentelemetry.metrics?.enabled) {
      metricReader = new PrometheusExporter({
        port: alliumConfig.opentelemetry.metrics.port || 9464,
        endpoint: alliumConfig.opentelemetry.metrics.endpoint || '/metrics',
      });
    }

    const sdk = new NodeSDK({
      serviceName: alliumConfig.opentelemetry.serviceName,
      traceExporter: new OTLPTraceExporter({
        url:
          alliumConfig.opentelemetry.otlpEndpoint ||
          'http://localhost:4318/v1/traces',
      }),
      metricReader,
      instrumentations: [
        getNodeAutoInstrumentations({
          // Disable deprecated fastify instrumentation in favor of @fastify/otel
          '@opentelemetry/instrumentation-fastify': { enabled: false },
          // Keep http enabled for outgoing requests and other http interactions
          '@opentelemetry/instrumentation-http': { enabled: true },
        }),
        new FastifyOtelInstrumentation({ registerOnInitialization: true }),
      ],
    });

    sdk.start();

    // Ensure clean shutdown
    process.on('SIGTERM', () => {
      sdk
        .shutdown()
        .then(() => console.log('Tracing terminated'))
        .catch((error) => console.log('Error terminating tracing', error));
    });
  }

  // Configure logger
  const loggerConfig: FastifyServerOptions['logger'] = alliumConfig.server
    ?.logger
    ? alliumConfig.server.logger
    : {
        level: alliumConfig.logging?.level || 'info',
        transport: alliumConfig.logging?.pretty
          ? {
              target: 'pino-pretty',
              options: {
                translateTime: 'HH:MM:ss Z',
                ignore: 'pid,hostname',
              },
            }
          : undefined,
        redact: alliumConfig.logging?.redact || [
          'req.headers.authorization',
          'req.body.password',
        ],
      };

  const fastify = Fastify({
    ...(server || {}),
    logger: loggerConfig,
  });

  // Register Allium core
  await fastify.register(app, alliumConfig);

  // Register user plugins
  if (plugins) {
    for (const plugin of plugins) {
      if (Array.isArray(plugin)) {
        await fastify.register(plugin[0], plugin[1]);
      } else {
        await fastify.register(plugin as any);
      }
    }
  }

  // Register Sentry error handler
  if (alliumConfig.sentry) {
    Sentry.setupFastifyErrorHandler(fastify);
  }

  return fastify;
}

async function syncDatabase(config: AlliumServerConfig) {
  const projectRoot = process.cwd();
  const models = config.models || [];
  const provider = config.prisma?.provider || 'postgresql';

  // 1. Generate Prisma Schema
  try {
    // Cast models to any to avoid type mismatch between runtime ModelDefinition and schema ModelDefinition
    const schema = generatePrismaSchema({ models: models as any }, provider);

    const prismaDir = path.join(projectRoot, '.allium', 'prisma');
    if (!fs.existsSync(prismaDir)) {
      fs.mkdirSync(prismaDir, { recursive: true });
    }

    const schemaPath = path.join(prismaDir, 'schema.prisma');
    fs.writeFileSync(schemaPath, schema);

    // 2. Sync Database
    console.log('Syncing database...');
    // Generate client
    execSync(`npx prisma generate --schema "${schemaPath}"`, {
      stdio: 'inherit',
    });

    // Push to DB
    // Push to DB
    // Use --accept-data-loss to avoid interactive prompts on startup
    const prismaCmd = `npx prisma db push --schema "${schemaPath}" --accept-data-loss`;

    try {
      execSync(prismaCmd, {
        stdio: 'inherit',
      });
    } catch (e) {
      // Fallback to local node_modules binary if npx fails or is not available
      const localPrisma = path.join(
        projectRoot,
        'node_modules',
        '.bin',
        'prisma'
      );
      if (fs.existsSync(localPrisma)) {
        execSync(
          `${localPrisma} db push --schema "${schemaPath}" --accept-data-loss`,
          {
            stdio: 'inherit',
          }
        );
      } else {
        throw e;
      }
    }
    console.log('Database synced successfully.');
  } catch (error: any) {
    if (error.message && error.message.includes('missing field definitions')) {
      console.error('\n❌ Error: Models are missing field definitions\n');
      console.error(
        "This usually happens when the schema hasn't been synced yet."
      );
      console.error('\n📝 To fix this, run:\n');
      console.error('   allium sync\n');
      console.error(
        'This will generate the schema from your model definitions.\n'
      );
      process.exit(1);
    } else {
      console.error('Failed to sync database:', error);
      throw error;
    }
  }
}

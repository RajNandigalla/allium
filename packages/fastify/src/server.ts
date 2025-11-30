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
  helmet?: FastifyHelmetOptions;

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
   * Any additional plugin configurations
   */
  [key: string]: any;

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

  const fastify = Fastify(server || { logger: true });

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
    execSync(`npx prisma db push --schema "${schemaPath}"`, {
      stdio: 'inherit',
    });
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

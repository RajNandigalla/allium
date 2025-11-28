import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';

export interface PrismaPluginOptions {
  /**
   * Database connection URL
   * Examples:
   * - SQLite: "file:./dev.db"
   * - MongoDB: "mongodb://localhost:27017/mydb"
   */
  datasourceUrl?: string;

  /**
   * Database provider type
   * Used to determine which adapter to use
   */
  provider?: 'sqlite' | 'mongodb' | 'postgresql' | 'mysql';

  /**
   * Enable query logging
   */
  log?: boolean;
}

/**
 * Database client factory configuration
 */
interface DatabaseClientFactory {
  createClient: (
    datasourceUrl: string | undefined,
    log: boolean
  ) => PrismaClient;
  getConnectionMessage: (datasourceUrl: string | undefined) => string;
}

/**
 * Database provider strategies
 */
const databaseProviders: Record<string, DatabaseClientFactory> = {
  sqlite: {
    createClient: (datasourceUrl, log) => {
      const dbPath = datasourceUrl?.replace('file:', '') || './dev.db';
      const adapter = new PrismaBetterSqlite3({ url: dbPath });

      return new PrismaClient({
        adapter,
        log: log ? ['query', 'info', 'warn', 'error'] : undefined,
      });
    },
    getConnectionMessage: (datasourceUrl) => {
      const dbPath = datasourceUrl?.replace('file:', '') || './dev.db';
      return `Prisma connected to SQLite: ${dbPath}`;
    },
  },

  mongodb: {
    createClient: (datasourceUrl, log) => {
      return new PrismaClient({
        log: log ? ['query', 'info', 'warn', 'error'] : undefined,
      });
    },
    getConnectionMessage: () => 'Prisma connected to MongoDB',
  },
};

/**
 * Prisma database plugin
 * Manages PrismaClient lifecycle and decorates Fastify with database access
 *
 * Supports:
 * - SQLite (via better-sqlite3 adapter)
 * - MongoDB (native support)
 *
 * @see https://www.prisma.io/docs
 */
export default fp<PrismaPluginOptions>(
  async (fastify: FastifyInstance, opts: PrismaPluginOptions) => {
    // Handle nested configuration (when used with fastify-autoload and AppOptions)
    const config = (opts as any).prisma || opts;
    const { datasourceUrl, provider = 'sqlite', log = false } = config;

    // Get database provider factory
    const dbFactory = databaseProviders[provider];
    if (!dbFactory) {
      throw new Error(
        `Unsupported database provider: ${provider}. Supported: ${Object.keys(
          databaseProviders
        ).join(', ')}`
      );
    }

    // Create Prisma client using factory
    const prisma = dbFactory.createClient(datasourceUrl, log);

    // Test connection
    try {
      await prisma.$connect();
      fastify.log.info('Prisma database connection established');
      fastify.log.info(dbFactory.getConnectionMessage(datasourceUrl));
    } catch (error) {
      fastify.log.error({ error }, 'Failed to connect to database');
      throw error;
    }

    // Decorate Fastify with Prisma client
    fastify.decorate('prisma', prisma);

    // Graceful shutdown
    fastify.addHook('onClose', async (instance) => {
      instance.log.info('Disconnecting Prisma...');
      await instance.prisma.$disconnect();
      instance.log.info('Prisma disconnected');
    });
  },
  { name: 'prisma' }
);

// TypeScript module augmentation
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}

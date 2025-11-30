import fp from 'fastify-plugin';
import { FastifyInstance } from 'fastify';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import {
  registerConfigRoutes,
  registerModelsRoutes,
  registerFieldsRoutes,
  registerRelationsRoutes,
  registerSchemaRoutes,
  registerApiKeysRoutes,
  registerDatabaseRoutes,
  registerDataRoutes,
  registerSystemRoutes,
} from './admin';

const execAsync = util.promisify(exec);

export interface AdminApiOptions {
  /**
   * Enable Admin API
   * @default process.env.NODE_ENV === 'development'
   */
  enable?: boolean;

  /**
   * Path to models directory
   * @default 'src/models'
   */
  modelsDir?: string;
}

/**
 * Admin API Plugin
 * Provides endpoints for managing the Allium schema and models
 */
const adminApi = async (fastify: FastifyInstance, opts: AdminApiOptions) => {
  // Only enable in development by default
  const isDev =
    process.env.NODE_ENV === 'development' ||
    process.env.NODE_ENV === undefined;
  const shouldEnable = opts.enable ?? isDev;

  if (!shouldEnable) {
    fastify.log.info('Admin API disabled (production mode)');
    return;
  }

  const projectRoot = process.cwd();
  const modelsDir = path.resolve(projectRoot, opts.modelsDir || 'src/models');
  const alliumDir = path.join(projectRoot, '.allium');

  // Helper to trigger sync
  const triggerSync = async () => {
    try {
      fastify.log.info('Triggering Allium sync...');
      await execAsync('npx allium sync');
      fastify.log.info('Allium sync completed');
    } catch (error) {
      fastify.log.error({ error }, 'Failed to sync Allium schema');
      throw error;
    }
  };

  // Register routes under /_admin prefix
  fastify.register(
    async (routes) => {
      // Register all route modules
      await registerConfigRoutes(routes, projectRoot);
      await registerModelsRoutes(routes, alliumDir, modelsDir, triggerSync);
      await registerFieldsRoutes(routes, alliumDir, triggerSync);
      await registerRelationsRoutes(routes, alliumDir, triggerSync);
      await registerSchemaRoutes(routes, alliumDir, triggerSync);
      await registerApiKeysRoutes(routes);
      await registerDatabaseRoutes(routes, alliumDir);
      await registerDataRoutes(routes);
      await registerSystemRoutes(routes);
    },
    { prefix: '/_admin' }
  );
};

export default fp(adminApi, {
  name: 'admin-api',
  dependencies: ['swagger'],
});

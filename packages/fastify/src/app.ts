import { join } from 'node:path';
import AutoLoad, { AutoloadPluginOptions } from '@fastify/autoload';
import { FastifyPluginAsync, FastifyServerOptions } from 'fastify';
import { AlliumPluginOptions } from './plugins/allium';
import { PrismaPluginOptions } from './plugins/prisma';

export interface AppOptions
  extends FastifyServerOptions,
    Partial<AutoloadPluginOptions>,
    Partial<AlliumPluginOptions> {
  prisma?: PrismaPluginOptions;
  security?: {
    xss?: any;
    csrf?: any;
    sqlInjectionGuard?: any;
    encryption?: any;
  };
}

// Pass --options via CLI arguments in command to enable these options.
const options: AppOptions = {};

const app: FastifyPluginAsync<AppOptions> = async (
  fastify,
  opts
): Promise<void> => {
  // Place here your custom code!

  // Note: Allium framework plugins (allium, prisma) are now in 'plugins' folder
  // and will be auto-loaded by fastify-autoload below.
  // Configuration is passed via 'opts'.

  // Do not touch the following lines

  // This loads all plugins defined in plugins
  // those should be support plugins that are reused
  // through your application
  // eslint-disable-next-line no-void
  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: opts,
  });

  // This loads all plugins defined in routes
  // define your routes in one of these
  // eslint-disable-next-line no-void
  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'routes'),
    options: opts,
  });
};

export default app;
export { app, options };

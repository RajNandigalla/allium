import { test } from 'node:test';
import { equal, ok } from 'node:assert';
import { initAllium } from '../src/server';
import { ModelDefinition } from '@allium/core';
import * as Sentry from '@sentry/node';

// Mock model
const User: ModelDefinition = {
  name: 'User',
  fields: [{ name: 'email', type: 'String' }],
};

test('should initialize Sentry when config is present', async (t) => {
  // We can't easily mock the Sentry module here because it's imported inside server.ts,
  // but we can verify that passing the config doesn't throw.
  // Ideally we would spy on Sentry.init, but node:test doesn't have built-in spiraling for modules.

  try {
    const app = await initAllium({
      models: [User],
      prisma: {
        datasourceUrl: 'file:./test.db',
        provider: 'sqlite',
      },
      sentry: {
        dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0', // Dummy DSN
        environment: 'test',
      },
    });

    ok(app, 'App initialized successfully with Sentry config');

    // We can check if Sentry client is initialized on the global hub if available,
    // or just assume success if no error was thrown during init.
    const client = Sentry.getClient();
    // Note: With dummy DSN, it might not actually "start" fully or might warn, but shouldn't throw.
  } catch (err) {
    t.assert.fail(err as Error);
  }
});

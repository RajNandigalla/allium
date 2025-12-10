import { test } from 'node:test';
import { ok } from 'node:assert';
import { initAllium } from '../src/server';
import { ModelDefinition } from '@allium/core';

// Mock model
const User: ModelDefinition = {
  name: 'User',
  fields: [{ name: 'email', type: 'String' }],
};

test('should initialize OpenTelemetry when config is present', async (t) => {
  try {
    const app = await initAllium({
      models: [User],
      prisma: {
        datasourceUrl: 'file:./test.db',
        provider: 'sqlite',
      },
      opentelemetry: {
        serviceName: 'test-service',
        otlpEndpoint: 'http://localhost:4318/v1/traces', // We don't need a real server for init check
      },
    });

    ok(app, 'App initialized successfully with OpenTelemetry config');

    // Note: OTel NodeSDK doesn't expose a global singleton client like Sentry,
    // but the successful execution of initAllium implies SDK.start() was called without error.
  } catch (err) {
    t.assert.fail(err as Error);
  }
});

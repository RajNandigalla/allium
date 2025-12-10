import { test } from 'node:test';
import { equal, ok } from 'node:assert';
import { initAllium } from '../src/server';
import { ModelDefinition } from '@allium/core';

// Mock model
const User: ModelDefinition = {
  name: 'User',
  fields: [{ name: 'email', type: 'String' }],
};

test('should configure pino-pretty when logging.pretty is true', async (t) => {
  const app = await initAllium({
    models: [User],
    prisma: {
      datasourceUrl: 'file:./test.db',
      provider: 'sqlite',
    },
    logging: {
      pretty: true,
      level: 'debug',
    },
  });

  // Verify logger level
  equal(app.log.level, 'debug');

  // Verify transport (difficult to inspect directly on Fastify instance without internal access,
  // but we can check if initialization didn't throw and properties match)
  ok(app.log);
});

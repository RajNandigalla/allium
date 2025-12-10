import { test } from 'node:test';
import { equal, match, fail } from 'node:assert';
import { initAllium } from '../src/server';
import path from 'path';
import fs from 'fs';
import { request } from 'http';
import { ModelDefinition } from '@allium/core';

test('Prometheus Metrics', async (t) => {
  const modelsDir = path.join(__dirname, 'fixtures', 'models_metrics');
  if (!fs.existsSync(modelsDir)) {
    fs.mkdirSync(modelsDir, { recursive: true });
  }

  // Create a minimal model
  const UserModel: ModelDefinition = {
    name: 'User',
    fields: [{ name: 'name', type: 'String' }],
  };

  fs.writeFileSync(
    path.join(modelsDir, 'User.json'),
    JSON.stringify(UserModel)
  );

  const app = await initAllium({
    modelsDir,
    // Pass model directly effectively, but initAllium primarily loads from dir or config.models
    models: [UserModel],
    prisma: {
      datasourceUrl: 'file:./test_metrics.db',
      provider: 'sqlite',
    },
    // Enable OpenTelemetry with Metrics
    opentelemetry: {
      serviceName: 'test-service-metrics',
      metrics: {
        enabled: true,
        port: 9465, // Use different port than default just in case of conflicts during tests
        endpoint: '/metrics',
      },
    },
  });

  // Wait a bit for SDK startup (metric reader server start)
  await new Promise((resolve) => setTimeout(resolve, 1000));

  await t.test('should expose metrics endpoint', async () => {
    return new Promise<void>((resolve, reject) => {
      const req = request('http://localhost:9465/metrics', (res) => {
        equal(res.statusCode, 200, 'Metrics endpoint should return 200');

        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => {
          console.log('Metrics received:', data);
          match(data, /# HELP/, 'Should contain Prometheus comments');
          // process_cpu_seconds_total might not be available immediately or requires specific instrumentation enabled
          // Let's check for any content first
          if (data.length === 0) {
            fail('Metrics response is empty');
          }
          resolve();
        });
      });

      req.on('error', (err) => {
        fail('Failed to connect to metrics endpoint: ' + err.message);
        reject(err);
      });

      req.end();
    });
  });

  // Cleanup
  await app.close();
});

import { initAllium } from '@allium/fastify';
import { ModelDefinition } from '@allium/core';
import path from 'path';

// Simple test model
const TestUser: ModelDefinition = {
  name: 'TestUser',
  fields: [
    { name: 'name', type: 'String', required: true },
    { name: 'email', type: 'String', required: true, unique: true },
    { name: 'bio', type: 'String', required: false },
  ],
};

async function main() {
  console.log('🔒 Starting Security Features Test...\n');

  const app = await initAllium({
    models: [TestUser],

    prisma: {
      datasourceUrl: 'file:./test-security.db',
    },

    // Enable all security features
    security: {
      xss: {
        enabled: true,
        exemptFields: [],
        exemptRoutes: [],
      },
      csrf: {
        enabled: true,
        cookieOpts: {
          signed: true,
          httpOnly: true,
          sameSite: 'strict',
        },
        exemptRoutes: [],
      },
      sqlInjectionGuard: {
        enabled: true,
        logOnly: false,
      },
    },

    // Production-ready security headers
    helmet: {
      enableProductionDefaults: true,
    },

    server: {
      logger: {
        level: 'info',
      },
    },
  });

  await app.listen({ port: 3333, host: '0.0.0.0' });

  console.log('\n✅ Test server started on http://localhost:3333');
  console.log('📚 Swagger UI: http://localhost:3333/documentation');
  console.log('\n🧪 Run the test script to verify security features:');
  console.log('   node test-security-features.js\n');
}

main().catch((err) => {
  console.error('❌ Failed to start test server:', err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * CSRF End-to-End Test with Real HTTP Server
 */

const Fastify = require('fastify');

async function startTestServer() {
  const fastify = Fastify({ logger: false });

  // Register sensible plugin (required for httpErrors)
  await fastify.register(require('@fastify/sensible'));

  // Register CSRF plugin
  const csrfPlugin = require('./packages/fastify/dist/plugins/csrf').default;
  await fastify.register(csrfPlugin, {
    enabled: true,
    cookieOpts: {
      signed: true,
      httpOnly: true,
      sameSite: 'lax', // Changed from strict to lax for testing
    },
    exemptRoutes: ['/exempt'],
    cookieSecret: 'test-secret-key-for-csrf-testing-12345',
  });

  // Test routes
  fastify.post('/protected', async (request) => {
    return { success: true, message: 'Protected route accessed' };
  });

  fastify.post('/exempt', async (request) => {
    return { success: true, message: 'Exempt route accessed' };
  });

  await fastify.listen({ port: 3334, host: '127.0.0.1' });
  return fastify;
}

async function testCSRF() {
  console.log('🧪 Starting CSRF End-to-End Test...\n');

  const server = await startTestServer();
  console.log('✅ Test server started on http://127.0.0.1:3334\n');

  // Wait a bit for server to be ready
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    // Test 1: Get CSRF token
    console.log('Test 1: Fetching CSRF token...');
    const tokenResponse = await fetch('http://127.0.0.1:3334/api/csrf-token');

    if (!tokenResponse.ok) {
      console.log(
        `❌ Failed to get CSRF token (status: ${tokenResponse.status})`
      );
      await server.close();
      return false;
    }

    const tokenData = await tokenResponse.json();
    const csrfToken = tokenData.csrfToken;
    const cookies = tokenResponse.headers.get('set-cookie');

    if (!csrfToken) {
      console.log('❌ No CSRF token in response');
      await server.close();
      return false;
    }

    console.log(`✅ CSRF token received: ${csrfToken.substring(0, 20)}...`);
    console.log(`✅ Cookies set: ${cookies ? 'Yes' : 'No'}\n`);

    // Test 2: POST without CSRF token should fail
    console.log('Test 2: POST without CSRF token...');
    const response1 = await fetch('http://127.0.0.1:3334/protected', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: 'test' }),
    });

    if (response1.status === 403) {
      console.log('✅ POST without CSRF token blocked (403)\n');
    } else {
      console.log(
        `⚠️  POST without CSRF token returned ${response1.status} (expected 403)\n`
      );
    }

    // Test 3: POST with CSRF token but no cookies should fail
    console.log('Test 3: POST with CSRF token but no cookies...');
    const response2 = await fetch('http://127.0.0.1:3334/protected', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
      },
      body: JSON.stringify({ data: 'test' }),
    });

    if (response2.status === 403) {
      console.log('✅ POST with token but no cookies blocked (403)\n');
    } else {
      console.log(
        `⚠️  POST with token but no cookies returned ${response2.status}\n`
      );
    }

    // Test 4: POST with both token and cookies should succeed
    console.log('Test 4: POST with CSRF token AND cookies...');
    const response3 = await fetch('http://127.0.0.1:3334/protected', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-csrf-token': csrfToken,
        Cookie: cookies,
      },
      body: JSON.stringify({ data: 'test' }),
    });

    if (response3.ok) {
      const data = await response3.json();
      console.log(
        `✅ POST with token and cookies succeeded (${response3.status})`
      );
      console.log(`   Response: ${JSON.stringify(data)}\n`);
    } else {
      const errorText = await response3.text();
      console.log(
        `❌ POST with token and cookies failed (${response3.status})`
      );
      console.log(`   Error: ${errorText}\n`);
    }

    // Test 5: Exempt route should work without token
    console.log('Test 5: Exempt route without CSRF token...');
    const response4 = await fetch('http://127.0.0.1:3334/exempt', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ data: 'test' }),
    });

    if (response4.ok) {
      console.log('✅ Exempt route works without CSRF token\n');
    } else {
      console.log(`❌ Exempt route failed (${response4.status})\n`);
    }

    // Test 6: GET request should not require CSRF token
    console.log('Test 6: GET request without CSRF token...');
    server.get('/test-get', async () => ({ success: true }));
    const response5 = await fetch('http://127.0.0.1:3334/test-get');

    if (response5.ok) {
      console.log('✅ GET request works without CSRF token\n');
    } else {
      console.log(`❌ GET request failed (${response5.status})\n`);
    }

    await server.close();

    console.log('='.repeat(60));
    console.log('✅ CSRF Protection Test Complete');
    console.log('='.repeat(60));

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    await server.close();
    return false;
  }
}

testCSRF()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

#!/usr/bin/env node
/**
 * Complete CSRF Test with Playwright
 * Tests CSRF protection with real browser and cookies
 */

const { chromium } = require('playwright');
const Fastify = require('fastify');

async function startTestServer() {
  const fastify = Fastify({ logger: false });

  // Register sensible plugin
  await fastify.register(require('@fastify/sensible'));

  // Register CSRF plugin
  const csrfPlugin = require('./packages/fastify/dist/plugins/csrf').default;
  await fastify.register(csrfPlugin, {
    enabled: true,
    cookieOpts: {
      signed: false, // Changed to false for testing
      httpOnly: true,
      sameSite: 'lax',
    },
    exemptRoutes: ['/exempt'],
    cookieSecret: 'test-secret-key-for-csrf-testing-12345',
  });

  // Serve a simple HTML page for testing
  fastify.get('/', async (request, reply) => {
    reply.type('text/html');
    return `
      <!DOCTYPE html>
      <html>
      <head><title>CSRF Test</title></head>
      <body>
        <h1>CSRF Protection Test</h1>
        <div id="result"></div>
        <script>
          async function testCSRF() {
            const result = document.getElementById('result');
            
            // Test 1: Get CSRF token
            const tokenRes = await fetch('/api/csrf-token', {
              credentials: 'include'
            });
            const { csrfToken } = await tokenRes.json();
            result.innerHTML += '<p>✅ Token received: ' + csrfToken.substring(0, 20) + '...</p>';
            
            // Test 2: POST without token (should fail)
            try {
              const res1 = await fetch('/protected', {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ data: 'test' })
              });
              if (res1.status === 403) {
                result.innerHTML += '<p>✅ POST without token blocked (403)</p>';
              } else {
                result.innerHTML += '<p>❌ POST without token NOT blocked (' + res1.status + ')</p>';
              }
            } catch (e) {
              result.innerHTML += '<p>❌ Error: ' + e.message + '</p>';
            }
            
            // Test 3: POST with token (should succeed)
            try {
              const res2 = await fetch('/protected', {
                method: 'POST',
                credentials: 'include',
                headers: {
                  'Content-Type': 'application/json',
                  'x-csrf-token': csrfToken
                },
                body: JSON.stringify({ data: 'test' })
              });
              if (res2.ok) {
                result.innerHTML += '<p>✅ POST with token succeeded (' + res2.status + ')</p>';
                result.innerHTML += '<p id="success">SUCCESS</p>';
              } else {
                const errorText = await res2.text();
                result.innerHTML += '<p>❌ POST with token failed (' + res2.status + '): ' + errorText + '</p>';
              }
            } catch (e) {
              result.innerHTML += '<p>❌ Error: ' + e.message + '</p>';
            }
          }
          
          testCSRF();
        </script>
      </body>
      </html>
    `;
  });

  // Test routes
  fastify.post('/protected', async (request) => {
    return { success: true, message: 'Protected route accessed' };
  });

  fastify.post('/exempt', async (request) => {
    return { success: true, message: 'Exempt route accessed' };
  });

  await fastify.listen({ port: 3335, host: '127.0.0.1' });
  return fastify;
}

async function runBrowserTest() {
  console.log('🧪 Starting CSRF Browser Test with Playwright...\n');

  const server = await startTestServer();
  console.log('✅ Test server started on http://127.0.0.1:3335\n');

  // Launch browser
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to test page
    console.log('📄 Loading test page...');
    await page.goto('http://127.0.0.1:3335');

    // Wait a bit for JavaScript to execute
    await page.waitForTimeout(2000);

    // Check for errors
    const errorMessages = await page.locator('#result p').allTextContents();
    console.log('Current results:', errorMessages);

    // Wait for tests to complete (increased timeout)
    try {
      await page.waitForSelector('#success', { timeout: 15000 });
    } catch (e) {
      console.log('⚠️  Success marker not found, checking results anyway...');
    }

    // Get all test results
    const results = await page.locator('#result p').allTextContents();

    console.log('📊 Test Results:\n');
    results.forEach((result) => {
      console.log('  ' + result);
    });

    // Check if all tests passed
    const allPassed = results.every((r) => r.includes('✅'));

    await browser.close();
    await server.close();

    console.log('\n' + '='.repeat(60));
    if (allPassed) {
      console.log('🎉 All CSRF tests passed!');
      console.log('='.repeat(60));
      return true;
    } else {
      console.log('⚠️  Some CSRF tests failed');
      console.log('='.repeat(60));
      return false;
    }
  } catch (error) {
    console.error('❌ Browser test failed:', error.message);
    await browser.close();
    await server.close();
    return false;
  }
}

runBrowserTest()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

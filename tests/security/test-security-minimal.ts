/**
 * Simple Security Middleware Test
 * Tests the security middleware in isolation without database
 */

import Fastify from 'fastify';
import { createXSSSanitizer } from './packages/fastify/src/middleware/xss-sanitizer';
import { createSQLInjectionGuard } from './packages/fastify/src/middleware/sql-injection-guard';

async function testXSSSanitizer() {
  console.log('\n🧪 Testing XSS Sanitizer...');

  const fastify = Fastify({ logger: false });

  // Register XSS sanitizer
  const xssSanitizer = createXSSSanitizer({ enabled: true });
  fastify.addHook('preHandler', xssSanitizer);

  // Test route
  fastify.post('/test', async (request) => {
    return { body: request.body };
  });

  await fastify.ready();

  // Test 1: Script tag removal
  const response1 = await fastify.inject({
    method: 'POST',
    url: '/test',
    payload: { name: '<script>alert("XSS")</script>' },
  });

  const data1 = JSON.parse(response1.body);
  if (!data1.body.name.includes('<script>')) {
    console.log('✅ Script tags removed from input');
  } else {
    console.log('❌ Script tags NOT removed');
    return false;
  }

  // Test 2: Event handler removal
  const response2 = await fastify.inject({
    method: 'POST',
    url: '/test',
    payload: { bio: '<img src=x onerror=alert("XSS")>' },
  });

  const data2 = JSON.parse(response2.body);
  if (!data2.body.bio.includes('onerror')) {
    console.log('✅ Event handlers removed from input');
  } else {
    console.log('❌ Event handlers NOT removed');
    return false;
  }

  // Test 3: Nested objects
  const response3 = await fastify.inject({
    method: 'POST',
    url: '/test',
    payload: {
      user: {
        name: '<script>alert(1)</script>',
        nested: {
          value: '<img src=x onerror=alert(2)>',
        },
      },
    },
  });

  const data3 = JSON.parse(response3.body);
  if (
    !data3.body.user.name.includes('<script>') &&
    !data3.body.user.nested.value.includes('onerror')
  ) {
    console.log('✅ Nested objects sanitized correctly');
  } else {
    console.log('❌ Nested objects NOT sanitized');
    return false;
  }

  await fastify.close();
  return true;
}

async function testSQLInjectionGuard() {
  console.log('\n🧪 Testing SQL Injection Guard...');

  const fastify = Fastify({ logger: false });

  // Register sensible plugin for httpErrors
  await fastify.register(require('@fastify/sensible'));

  // Register SQL injection guard
  const sqlGuard = createSQLInjectionGuard({ enabled: true, logOnly: false });
  fastify.addHook('preHandler', sqlGuard);

  // Test route
  fastify.get('/test', async (request) => {
    return { query: request.query };
  });

  await fastify.ready();

  // Test 1: SQL comment detection
  const response1 = await fastify.inject({
    method: 'GET',
    url: "/test?name=admin'--",
  });

  if (response1.statusCode === 400) {
    console.log("✅ SQL comment pattern blocked (admin'--) ");
  } else {
    console.log(
      `❌ SQL comment pattern NOT blocked (status: ${response1.statusCode})`
    );
    return false;
  }

  // Test 2: UNION attack detection
  const response2 = await fastify.inject({
    method: 'GET',
    url: '/test?query=1 UNION SELECT * FROM users',
  });

  if (response2.statusCode === 400) {
    console.log('✅ UNION attack pattern blocked');
  } else {
    console.log(
      `❌ UNION attack pattern NOT blocked (status: ${response2.statusCode})`
    );
    return false;
  }

  // Test 3: Legitimate query passes
  const response3 = await fastify.inject({
    method: 'GET',
    url: '/test?name=John&email=john@example.com',
  });

  if (response3.statusCode === 200) {
    console.log('✅ Legitimate query passed through');
  } else {
    console.log(
      `❌ Legitimate query blocked (status: ${response3.statusCode})`
    );
    return false;
  }

  await fastify.close();
  return true;
}

async function testCSRFPlugin() {
  console.log('\n🧪 Testing CSRF Protection...');

  const fastify = Fastify({ logger: false });

  // Register CSRF plugin
  await fastify.register(
    require('./packages/fastify/src/plugins/csrf').default,
    {
      enabled: true,
      exemptRoutes: [],
    }
  );

  // Test route
  fastify.post('/test', async (request) => {
    return { success: true };
  });

  await fastify.ready();

  // Test 1: CSRF token endpoint exists
  const tokenResponse = await fastify.inject({
    method: 'GET',
    url: '/api/csrf-token',
  });

  if (tokenResponse.statusCode === 200) {
    const data = JSON.parse(tokenResponse.body);
    if (data.csrfToken) {
      console.log(
        `✅ CSRF token generated: ${data.csrfToken.substring(0, 20)}...`
      );
    } else {
      console.log('❌ CSRF token not in response');
      return false;
    }
  } else {
    console.log(
      `❌ CSRF token endpoint failed (status: ${tokenResponse.statusCode})`
    );
    return false;
  }

  // Test 2: POST without token is blocked
  const response1 = await fastify.inject({
    method: 'POST',
    url: '/test',
    payload: { data: 'test' },
  });

  if (response1.statusCode === 403) {
    console.log('✅ POST without CSRF token blocked');
  } else {
    console.log(
      `❌ POST without CSRF token NOT blocked (status: ${response1.statusCode})`
    );
    return false;
  }

  await fastify.close();
  return true;
}

async function testSecurityHeaders() {
  console.log('\n🧪 Testing Security Headers...');

  const fastify = Fastify({ logger: false });

  // Register helmet plugin
  await fastify.register(
    require('./packages/fastify/src/plugins/helmet').default,
    {
      enableProductionDefaults: true,
    }
  );

  fastify.get('/test', async () => {
    return { success: true };
  });

  await fastify.ready();

  const response = await fastify.inject({
    method: 'GET',
    url: '/test',
  });

  const headers = response.headers;

  // Check for key security headers
  const checks = [
    { name: 'x-frame-options', expected: true },
    { name: 'x-content-type-options', expected: true },
    { name: 'strict-transport-security', expected: true },
    { name: 'content-security-policy', expected: true },
  ];

  let allPresent = true;
  for (const check of checks) {
    if (headers[check.name]) {
      console.log(
        `✅ ${check.name}: ${headers[check.name].substring(0, 50)}...`
      );
    } else {
      console.log(`❌ Missing header: ${check.name}`);
      allPresent = false;
    }
  }

  await fastify.close();
  return allPresent;
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('🔒 Security Middleware Tests (Minimal)');
  console.log('='.repeat(60));

  const results = {};

  try {
    results.xss = await testXSSSanitizer();
  } catch (error) {
    console.log(`❌ XSS test failed: ${error.message}`);
    results.xss = false;
  }

  try {
    results.sqlInjection = await testSQLInjectionGuard();
  } catch (error) {
    console.log(`❌ SQL injection test failed: ${error.message}`);
    results.sqlInjection = false;
  }

  try {
    results.csrf = await testCSRFPlugin();
  } catch (error) {
    console.log(`❌ CSRF test failed: ${error.message}`);
    results.csrf = false;
  }

  try {
    results.headers = await testSecurityHeaders();
  } catch (error) {
    console.log(`❌ Security headers test failed: ${error.message}`);
    results.headers = false;
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results');
  console.log('='.repeat(60));

  const tests = [
    { name: 'XSS Sanitization', result: results.xss },
    { name: 'SQL Injection Detection', result: results.sqlInjection },
    { name: 'CSRF Protection', result: results.csrf },
    { name: 'Security Headers', result: results.headers },
  ];

  tests.forEach((test) => {
    const status = test.result ? '✅ PASS' : '❌ FAIL';
    console.log(`${status} - ${test.name}`);
  });

  const passedCount = tests.filter((t) => t.result).length;
  const totalCount = tests.length;

  console.log('\n' + '='.repeat(60));
  if (passedCount === totalCount) {
    console.log(`🎉 All tests passed! (${passedCount}/${totalCount})`);
  } else {
    console.log(`⚠️  Some tests failed (${passedCount}/${totalCount} passed)`);
  }
  console.log('='.repeat(60) + '\n');

  process.exit(passedCount === totalCount ? 0 : 1);
}

runTests().catch((error) => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});

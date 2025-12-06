#!/usr/bin/env node
/**
 * Simple Security Middleware Test
 * Tests the security middleware in isolation without database
 */

const Fastify = require('fastify');
const {
  createXSSSanitizer,
} = require('./packages/fastify/dist/middleware/xss-sanitizer');
const {
  createSQLInjectionGuard,
} = require('./packages/fastify/dist/middleware/sql-injection-guard');

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
    console.log('   Got:', data1.body.name);
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
    console.log('   Got:', data2.body.bio);
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

async function testSecurityHeaders() {
  console.log('\n🧪 Testing Security Headers...');

  const fastify = Fastify({ logger: false });

  // Register helmet plugin
  const helmetPlugin =
    require('./packages/fastify/dist/plugins/helmet').default;
  await fastify.register(helmetPlugin, {
    enableProductionDefaults: true,
  });

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
    'x-frame-options',
    'x-content-type-options',
    'strict-transport-security',
    'content-security-policy',
  ];

  let allPresent = true;
  for (const headerName of checks) {
    const value = headers[headerName];
    if (value) {
      const displayValue = String(value).substring(0, 50);
      console.log(`✅ ${headerName}: ${displayValue}...`);
    } else {
      console.log(`❌ Missing header: ${headerName}`);
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

  const results = {
    xss: false,
    sqlInjection: false,
    headers: false,
  };

  try {
    results.xss = await testXSSSanitizer();
  } catch (error) {
    console.log(`❌ XSS test failed: ${error.message}`);
    console.error(error.stack);
  }

  try {
    results.sqlInjection = await testSQLInjectionGuard();
  } catch (error) {
    console.log(`❌ SQL injection test failed: ${error.message}`);
    console.error(error.stack);
  }

  try {
    results.headers = await testSecurityHeaders();
  } catch (error) {
    console.log(`❌ Security headers test failed: ${error.message}`);
    console.error(error.stack);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results');
  console.log('='.repeat(60));

  const tests = [
    { name: 'XSS Sanitization', result: results.xss },
    { name: 'SQL Injection Detection', result: results.sqlInjection },
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
  console.error(error.stack);
  process.exit(1);
});

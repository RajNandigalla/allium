#!/usr/bin/env node
/**
 * Additional Security Tests
 * Tests CSRF protection and encryption features
 */

const Fastify = require('fastify');
const {
  encrypt,
  decrypt,
  encryptWithVersion,
  decryptWithVersion,
  encryptJSON,
  decryptJSON,
} = require('./packages/core/dist/utils/encryption');

async function testCSRFProtection() {
  console.log('\n🧪 Testing CSRF Protection...');

  const fastify = Fastify({ logger: false });

  // Register CSRF plugin (it will register cookie plugin internally)
  const csrfPlugin = require('./packages/fastify/dist/plugins/csrf').default;
  await fastify.register(csrfPlugin, {
    enabled: true,
    cookieOpts: {
      signed: true,
      httpOnly: true,
      sameSite: 'strict',
    },
    exemptRoutes: ['/exempt'],
    cookieSecret: 'test-secret-key-for-csrf-testing',
  });

  // Test routes
  fastify.post('/protected', async (request) => {
    return { success: true };
  });

  fastify.post('/exempt', async (request) => {
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
      await fastify.close();
      return false;
    }
  } else {
    console.log(
      `❌ CSRF token endpoint failed (status: ${tokenResponse.statusCode})`
    );
    await fastify.close();
    return false;
  }

  // Test 2: POST without token is blocked
  const response1 = await fastify.inject({
    method: 'POST',
    url: '/protected',
    payload: { data: 'test' },
  });

  if (response1.statusCode === 403) {
    console.log('✅ POST without CSRF token blocked (403)');
  } else {
    console.log(
      `❌ POST without CSRF token NOT blocked (status: ${response1.statusCode})`
    );
    await fastify.close();
    return false;
  }

  // Test 3: Exempt route works without token
  const response2 = await fastify.inject({
    method: 'POST',
    url: '/exempt',
    payload: { data: 'test' },
  });

  if (response2.statusCode === 200) {
    console.log('✅ Exempt route works without CSRF token');
  } else {
    console.log(`❌ Exempt route blocked (status: ${response2.statusCode})`);
    await fastify.close();
    return false;
  }

  // Test 4: GET requests are not blocked
  fastify.get('/test-get', async () => ({ success: true }));
  const response3 = await fastify.inject({
    method: 'GET',
    url: '/test-get',
  });

  if (response3.statusCode === 200) {
    console.log('✅ GET requests not blocked by CSRF');
  } else {
    console.log(`❌ GET request blocked (status: ${response3.statusCode})`);
    await fastify.close();
    return false;
  }

  await fastify.close();
  return true;
}

async function testEncryption() {
  console.log('\n🧪 Testing Encryption Features...');

  const testKey = 'test-encryption-key-32-chars-long!!';
  const testData = 'sensitive-data-123';

  // Test 1: Basic encryption/decryption
  try {
    const encrypted = encrypt(testData, testKey);
    const decrypted = decrypt(encrypted, testKey);

    if (decrypted === testData) {
      console.log('✅ Basic encryption/decryption works');
    } else {
      console.log('❌ Decrypted data does not match original');
      console.log(`   Expected: ${testData}`);
      console.log(`   Got: ${decrypted}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Basic encryption failed: ${error.message}`);
    return false;
  }

  // Test 2: Key rotation (versioned encryption)
  try {
    const keyV1 = 'old-key-version-1-32-chars-long!!';
    const keyV2 = 'new-key-version-2-32-chars-long!!';

    // Encrypt with version 1
    const encryptedV1 = encryptWithVersion(testData, keyV1, 1);

    // Encrypt with version 2
    const encryptedV2 = encryptWithVersion(testData, keyV2, 2);

    // Decrypt with multiple keys
    const keys = { 1: keyV1, 2: keyV2 };
    const decryptedV1 = decryptWithVersion(encryptedV1, keys);
    const decryptedV2 = decryptWithVersion(encryptedV2, keys);

    if (decryptedV1 === testData && decryptedV2 === testData) {
      console.log('✅ Key rotation (versioned encryption) works');
    } else {
      console.log('❌ Key rotation failed');
      return false;
    }
  } catch (error) {
    console.log(`❌ Key rotation failed: ${error.message}`);
    return false;
  }

  // Test 3: JSON field encryption
  try {
    const jsonData = {
      cardNumber: '1234-5678-9012-3456',
      cvv: '123',
      expiry: '12/25',
    };

    const encryptedJSON = encryptJSON(jsonData, testKey);
    const decryptedJSON = decryptJSON(encryptedJSON, testKey);

    if (JSON.stringify(decryptedJSON) === JSON.stringify(jsonData)) {
      console.log('✅ JSON field encryption works');
    } else {
      console.log('❌ JSON encryption failed');
      console.log(`   Expected: ${JSON.stringify(jsonData)}`);
      console.log(`   Got: ${JSON.stringify(decryptedJSON)}`);
      return false;
    }
  } catch (error) {
    console.log(`❌ JSON encryption failed: ${error.message}`);
    return false;
  }

  // Test 4: Backward compatibility (decrypt old format without version)
  try {
    const oldFormatEncrypted = encrypt(testData, testKey);
    const keys = { 1: testKey };
    const decrypted = decryptWithVersion(oldFormatEncrypted, keys);

    if (decrypted === testData) {
      console.log('✅ Backward compatibility with old encrypted data');
    } else {
      console.log('❌ Backward compatibility failed');
      return false;
    }
  } catch (error) {
    console.log(`❌ Backward compatibility failed: ${error.message}`);
    return false;
  }

  return true;
}

async function testXSSExemptions() {
  console.log('\n🧪 Testing XSS Exemptions...');

  const {
    createXSSSanitizer,
  } = require('./packages/fastify/dist/middleware/xss-sanitizer');
  const fastify = Fastify({ logger: false });

  // Register XSS sanitizer with exemptions
  const xssSanitizer = createXSSSanitizer({
    enabled: true,
    exemptFields: ['htmlContent'],
    exemptRoutes: ['/api/content/*'],
  });
  fastify.addHook('preHandler', xssSanitizer);

  fastify.post('/api/users', async (request) => {
    return { body: request.body };
  });

  fastify.post('/api/content/posts', async (request) => {
    return { body: request.body };
  });

  await fastify.ready();

  // Test 1: Exempt field allows HTML
  const response1 = await fastify.inject({
    method: 'POST',
    url: '/api/users',
    payload: {
      name: '<script>alert(1)</script>',
      htmlContent: '<p>This is <b>allowed</b> HTML</p>',
    },
  });

  const data1 = JSON.parse(response1.body);
  if (
    !data1.body.name.includes('<script>') &&
    data1.body.htmlContent.includes('<b>')
  ) {
    console.log('✅ Exempt fields preserve HTML');
  } else {
    console.log('❌ Exempt fields not working correctly');
    await fastify.close();
    return false;
  }

  // Test 2: Exempt route allows HTML
  const response2 = await fastify.inject({
    method: 'POST',
    url: '/api/content/posts',
    payload: {
      content: '<script>alert(2)</script>',
    },
  });

  const data2 = JSON.parse(response2.body);
  if (data2.body.content.includes('<script>')) {
    console.log('✅ Exempt routes preserve HTML');
  } else {
    console.log('❌ Exempt routes not working correctly');
    await fastify.close();
    return false;
  }

  await fastify.close();
  return true;
}

async function runTests() {
  console.log('='.repeat(60));
  console.log('🔒 Additional Security Tests');
  console.log('='.repeat(60));

  const results = {
    csrf: false,
    encryption: false,
    xssExemptions: false,
  };

  try {
    results.csrf = await testCSRFProtection();
  } catch (error) {
    console.log(`❌ CSRF test failed: ${error.message}`);
    console.error(error.stack);
  }

  try {
    results.encryption = await testEncryption();
  } catch (error) {
    console.log(`❌ Encryption test failed: ${error.message}`);
    console.error(error.stack);
  }

  try {
    results.xssExemptions = await testXSSExemptions();
  } catch (error) {
    console.log(`❌ XSS exemptions test failed: ${error.message}`);
    console.error(error.stack);
  }

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Results');
  console.log('='.repeat(60));

  const tests = [
    { name: 'CSRF Protection', result: results.csrf },
    { name: 'Encryption & Key Rotation', result: results.encryption },
    { name: 'XSS Exemptions', result: results.xssExemptions },
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

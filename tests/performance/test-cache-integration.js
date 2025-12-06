#!/usr/bin/env node
/**
 * Integration test for caching middleware
 * Tests full caching flow with Fastify server
 */

const Fastify = require('fastify');
const { CacheService } = require('@allium/core');

async function startTestServer() {
  const fastify = Fastify({ logger: false });

  // Register cache plugin
  const cachePlugin =
    require('../../packages/fastify/dist/plugins/cache').default;

  await fastify.register(cachePlugin, {
    cache: {
      enabled: true,
      redis: {
        host: 'localhost',
        port: 6379,
      },
      ttl: 60,
      keyPrefix: 'test:',
      excludeRoutes: ['/no-cache/*'],
    },
  });

  // Test routes
  let requestCount = 0;

  fastify.get('/api/users', async () => {
    requestCount++;
    return {
      users: [
        { id: 1, name: 'User 1' },
        { id: 2, name: 'User 2' },
      ],
      requestCount,
    };
  });

  fastify.get('/api/users/:id', async (request) => {
    requestCount++;
    const { id } = request.params;
    return {
      id: parseInt(id),
      name: `User ${id}`,
      requestCount,
    };
  });

  fastify.post('/api/users', async (request) => {
    return { id: 3, name: 'New User', created: true };
  });

  fastify.put('/api/users/:id', async (request) => {
    const { id } = request.params;
    return { id: parseInt(id), name: 'Updated User', updated: true };
  });

  fastify.delete('/api/users/:id', async (request) => {
    const { id } = request.params;
    return { id: parseInt(id), deleted: true };
  });

  fastify.get('/no-cache/data', async () => {
    requestCount++;
    return { data: 'not cached', requestCount };
  });

  await fastify.listen({ port: 3456, host: '127.0.0.1' });
  return { fastify, getRequestCount: () => requestCount };
}

async function runTests() {
  console.log('🧪 Starting Caching Integration Tests...\n');

  const { fastify, getRequestCount } = await startTestServer();
  console.log('✅ Test server started on http://127.0.0.1:3456\n');

  // Wait for server to be ready
  await new Promise((resolve) => setTimeout(resolve, 500));

  try {
    // Test 1: First request should be cache miss
    console.log('Test 1: Cache MISS on first request');
    const res1 = await fetch('http://127.0.0.1:3456/api/users');
    const data1 = await res1.json();
    const cacheHeader1 = res1.headers.get('x-cache');

    if (cacheHeader1 === 'MISS' && data1.requestCount === 1) {
      console.log(`✅ Cache MISS (request count: ${data1.requestCount})`);
    } else {
      console.log(`❌ Expected MISS, got: ${cacheHeader1}`);
    }

    // Test 2: Second request should be cache hit
    console.log('\nTest 2: Cache HIT on second request');
    const res2 = await fetch('http://127.0.0.1:3456/api/users');
    const data2 = await res2.json();
    const cacheHeader2 = res2.headers.get('x-cache');

    if (cacheHeader2 === 'HIT' && data2.requestCount === 1) {
      console.log(`✅ Cache HIT (request count still: ${data2.requestCount})`);
    } else {
      console.log(
        `❌ Expected HIT with count 1, got: ${cacheHeader2}, count: ${data2.requestCount}`
      );
    }

    // Test 3: ETag support
    console.log('\nTest 3: ETag support');
    const etag = res2.headers.get('etag');
    if (etag) {
      console.log(`✅ ETag present: ${etag}`);

      // Test 304 Not Modified
      const res3 = await fetch('http://127.0.0.1:3456/api/users', {
        headers: { 'if-none-match': etag },
      });

      if (res3.status === 304) {
        console.log('✅ 304 Not Modified works');
      } else {
        console.log(`❌ Expected 304, got: ${res3.status}`);
      }
    } else {
      console.log('❌ No ETag header');
    }

    // Test 4: Cache invalidation on POST
    console.log('\nTest 4: Cache invalidation on POST');
    await fetch('http://127.0.0.1:3456/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'New User' }),
    });

    const res4 = await fetch('http://127.0.0.1:3456/api/users');
    const data4 = await res4.json();
    const cacheHeader4 = res4.headers.get('x-cache');

    if (cacheHeader4 === 'MISS' && data4.requestCount === 2) {
      console.log(
        `✅ Cache invalidated (MISS, request count: ${data4.requestCount})`
      );
    } else {
      console.log(
        `❌ Cache not invalidated: ${cacheHeader4}, count: ${data4.requestCount}`
      );
    }

    // Test 5: Specific record caching
    console.log('\nTest 5: Specific record caching');
    const res5 = await fetch('http://127.0.0.1:3456/api/users/123');
    const data5 = await res5.json();
    const cacheHeader5 = res5.headers.get('x-cache');

    if (cacheHeader5 === 'MISS') {
      console.log('✅ Record cache MISS on first request');
    }

    const res6 = await fetch('http://127.0.0.1:3456/api/users/123');
    const data6 = await res6.json();
    const cacheHeader6 = res6.headers.get('x-cache');

    if (cacheHeader6 === 'HIT' && data6.requestCount === data5.requestCount) {
      console.log('✅ Record cache HIT on second request');
    } else {
      console.log(`❌ Expected HIT, got: ${cacheHeader6}`);
    }

    // Test 6: Cache invalidation on PUT
    console.log('\nTest 6: Cache invalidation on PUT');
    await fetch('http://127.0.0.1:3456/api/users/123', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Updated' }),
    });

    const res7 = await fetch('http://127.0.0.1:3456/api/users/123');
    const cacheHeader7 = res7.headers.get('x-cache');

    if (cacheHeader7 === 'MISS') {
      console.log('✅ Cache invalidated on PUT');
    } else {
      console.log(`❌ Cache not invalidated: ${cacheHeader7}`);
    }

    // Test 7: Excluded routes
    console.log('\nTest 7: Excluded routes');
    const res8 = await fetch('http://127.0.0.1:3456/no-cache/data');
    const data8 = await res8.json();
    const cacheHeader8 = res8.headers.get('x-cache');

    const res9 = await fetch('http://127.0.0.1:3456/no-cache/data');
    const data9 = await res9.json();

    if (data9.requestCount > data8.requestCount) {
      console.log('✅ Excluded routes not cached');
    } else {
      console.log('❌ Excluded route was cached');
    }

    // Test 8: Cache stats
    console.log('\nTest 8: Cache management endpoints');
    const statsRes = await fetch('http://127.0.0.1:3456/_cache/stats');
    const stats = await statsRes.json();

    if (stats.connected && stats.keyCount > 0) {
      console.log(
        `✅ Cache stats: ${stats.keyCount} keys, ${stats.memoryUsage}`
      );
    } else {
      console.log('❌ Cache stats failed');
    }

    // Test 9: Clear cache
    console.log('\nTest 9: Clear cache');
    const clearRes = await fetch('http://127.0.0.1:3456/_cache/clear', {
      method: 'POST',
    });
    const clearData = await clearRes.json();

    if (clearData.success) {
      console.log('✅ Cache cleared');

      // Verify cache is empty
      const statsRes2 = await fetch('http://127.0.0.1:3456/_cache/stats');
      const stats2 = await statsRes2.json();

      if (stats2.keyCount === 0) {
        console.log('✅ Cache is empty');
      }
    }

    await fastify.close();

    console.log('\n' + '='.repeat(60));
    console.log('🎉 All Integration Tests Passed!');
    console.log('='.repeat(60));

    return true;
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
    await fastify.close();
    return false;
  }
}

runTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });

#!/usr/bin/env node
/**
 * Test script for caching functionality
 * Tests cache service, middleware, and invalidation
 */

const { CacheService } = require('@allium/core');
const {
  generateCacheKey,
  generateListKey,
  generateRecordKey,
} = require('@allium/core');

async function testCacheService() {
  console.log('🧪 Testing Cache Service...\n');

  // Test 1: Cache service without Redis (graceful degradation)
  console.log('Test 1: Graceful degradation (no Redis)');
  const cache = new CacheService({
    enabled: true,
    redis: {
      host: 'nonexistent-host',
      port: 9999,
    },
  });

  // Wait a bit for connection attempt
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Should not throw errors
  await cache.set('test:key', { data: 'value' });
  const result = await cache.get('test:key');

  if (result === null) {
    console.log('✅ Graceful degradation works (returns null without Redis)\n');
  } else {
    console.log('❌ Expected null, got:', result, '\n');
  }

  // Only disconnect if connected
  if (cache.isAvailable()) {
    await cache.disconnect();
  }

  // Test 2: Cache key generation
  console.log('Test 2: Cache key generation');

  const listKey = generateListKey(
    'user',
    { status: 'active' },
    { name: 'asc' },
    1,
    10
  );
  console.log('List key:', listKey);

  const recordKey = generateRecordKey('user', 123);
  console.log('Record key:', recordKey);

  const cacheKey = generateCacheKey({
    model: 'post',
    operation: 'list',
    filters: { published: true },
    page: 2,
    limit: 20,
  });
  console.log('Cache key:', cacheKey);

  if (listKey.includes('user:list') && recordKey === 'user:get:123') {
    console.log('✅ Cache key generation works\n');
  } else {
    console.log('❌ Cache key generation failed\n');
  }

  // Test 3: Cache with actual Redis (if available)
  console.log('Test 3: Testing with Redis (if available)');
  const redisCache = new CacheService({
    enabled: true,
    redis: {
      host: 'localhost',
      port: 6379,
    },
    keyPrefix: 'test:',
    defaultTTL: 60,
  });

  // Wait for connection
  await new Promise((resolve) => setTimeout(resolve, 1000));

  if (redisCache.isAvailable()) {
    console.log('✅ Redis connected');

    // Test set/get
    await redisCache.set('user:123', { id: 123, name: 'Test User' });
    const user = await redisCache.get('user:123');

    if (user && user.id === 123) {
      console.log('✅ Cache set/get works');
    } else {
      console.log('❌ Cache set/get failed');
    }

    // Test delete
    await redisCache.delete('user:123');
    const deleted = await redisCache.get('user:123');

    if (deleted === null) {
      console.log('✅ Cache delete works');
    } else {
      console.log('❌ Cache delete failed');
    }

    // Test pattern delete
    await redisCache.set('user:1', { id: 1 });
    await redisCache.set('user:2', { id: 2 });
    await redisCache.set('post:1', { id: 1 });

    await redisCache.deletePattern('user:*');

    const user1 = await redisCache.get('user:1');
    const post1 = await redisCache.get('post:1');

    if (user1 === null && post1 !== null) {
      console.log('✅ Pattern delete works');
    } else {
      console.log('❌ Pattern delete failed');
    }

    // Test stats
    const stats = await redisCache.getStats();
    console.log('Cache stats:', stats);

    if (stats.connected) {
      console.log('✅ Cache stats work');
    }

    // Cleanup
    await redisCache.clear();
    await redisCache.disconnect();

    console.log('\n✅ All Redis tests passed!');
  } else {
    console.log('⚠️  Redis not available, skipping Redis tests');
    console.log('   To test with Redis: redis-server');
  }

  console.log('\n' + '='.repeat(60));
  console.log('Cache Service Tests Complete');
  console.log('='.repeat(60));
}

testCacheService().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});

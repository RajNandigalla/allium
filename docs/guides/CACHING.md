# Caching Guide

## Overview

Allium provides built-in Redis-based caching to significantly improve API performance and reduce database load. The caching system implements a cache-aside pattern with automatic invalidation and graceful degradation.

## Features

- ✅ **Automatic caching** of GET requests
- ✅ **Automatic invalidation** on write operations (POST/PUT/PATCH/DELETE)
- ✅ **ETag support** for 304 Not Modified responses
- ✅ **Graceful degradation** - works without Redis
- ✅ **Configurable TTL** per route or globally
- ✅ **Cache management endpoints** for monitoring and clearing
- ✅ **Pattern-based invalidation** for related records

---

## Quick Start

### 1. Install Redis

```bash
# macOS
brew install redis
redis-server

# Docker
docker run -d -p 6379:6379 redis:alpine

# Or use a managed service (Redis Cloud, AWS ElastiCache, etc.)
```

### 2. Enable Caching

```typescript
import { initAllium } from '@allium/fastify';

const app = await initAllium({
  models,
  prisma: {
    datasourceUrl: process.env.DATABASE_URL,
  },

  cache: {
    enabled: true,
    redis: {
      url: process.env.REDIS_URL || 'redis://localhost:6379',
    },
    ttl: 300, // 5 minutes default
  },
});
```

### 3. That's it!

Caching is now automatic for all GET requests. No code changes needed!

---

## Configuration

### Basic Configuration

```typescript
cache: {
  enabled: true,
  redis: {
    url: 'redis://localhost:6379'
  },
  ttl: 300, // Default TTL in seconds
}
```

### Advanced Configuration

```typescript
cache: {
  enabled: true,

  // Redis connection
  redis: {
    host: 'localhost',
    port: 6379,
    password: process.env.REDIS_PASSWORD,
    db: 0
  },

  // Cache settings
  ttl: 600, // 10 minutes
  keyPrefix: 'myapp:', // Prefix for all cache keys

  // Exclude routes from caching
  excludeRoutes: [
    '/api/admin/*',
    '/api/auth/*',
    '/_cache/*'
  ],

  // Exclude authenticated requests
  excludeAuthenticatedRequests: true,

  // Use private cache headers
  cachePrivate: false,

  // Cache invalidation
  invalidation: {
    enabled: true
  }
}
```

### Environment Variables

```bash
# Redis connection
REDIS_URL=redis://localhost:6379

# Or individual settings
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=your-password
REDIS_DB=0

# Cache settings
CACHE_ENABLED=true
CACHE_TTL=300
```

---

## How It Works

### Cache-Aside Pattern

```
┌─────────┐
│ Request │
└────┬────┘
     │
     ▼
┌─────────────┐
│ Check Cache │
└──┬──────┬───┘
   │      │
   │ Hit  │ Miss
   │      │
   ▼      ▼
┌──────┐ ┌──────────┐
│Return│ │Query DB  │
│Cache │ │          │
└──────┘ └────┬─────┘
              │
              ▼
         ┌──────────┐
         │Set Cache │
         └────┬─────┘
              │
              ▼
         ┌──────────┐
         │  Return  │
         └──────────┘
```

### Automatic Invalidation

**On CREATE (POST)**:

- Invalidates all list queries for the model
- Invalidates count queries

**On UPDATE (PUT/PATCH)**:

- Invalidates specific record cache
- Invalidates all list queries
- Invalidates count queries

**On DELETE**:

- Invalidates specific record cache
- Invalidates all list queries
- Invalidates count queries

---

## Cache Headers

### Response Headers

```http
HTTP/1.1 200 OK
X-Cache: HIT
Cache-Control: public, max-age=300
ETag: "abc123"
```

- `X-Cache: HIT` - Response from cache
- `X-Cache: MISS` - Response from database
- `Cache-Control` - Browser caching directive
- `ETag` - For conditional requests (304 Not Modified)

### Conditional Requests

Clients can use ETags for efficient caching:

```http
GET /api/users
If-None-Match: "abc123"

HTTP/1.1 304 Not Modified
```

---

## Cache Management

### Cache Statistics

```bash
GET /_cache/stats
```

Response:

```json
{
  "connected": true,
  "keyCount": 42,
  "memoryUsage": "2.5M"
}
```

### Clear All Cache

```bash
POST /_cache/clear
```

### Clear Specific Pattern

```bash
DELETE /_cache/user:*
```

Clears all user-related cache keys.

---

## Performance Impact

### Expected Improvements

- **Cache Hit**: 10-50x faster response time
- **Database Load**: 50-90% reduction for read-heavy workloads
- **Throughput**: 5-10x increase in requests per second

### Benchmarks

```bash
# Without cache
ab -n 1000 -c 10 http://localhost:3000/api/users
# Requests per second: 100

# With cache
ab -n 1000 -c 10 http://localhost:3000/api/users
# Requests per second: 1000+ (10x improvement)
```

---

## Best Practices

### 1. Set Appropriate TTL

```typescript
cache: {
  ttl: 300, // 5 minutes for frequently changing data
  // or
  ttl: 3600, // 1 hour for stable data
}
```

### 2. Exclude Sensitive Routes

```typescript
cache: {
  excludeRoutes: ['/api/admin/*', '/api/auth/*', '/api/payments/*'];
}
```

### 3. Exclude Authenticated Requests

```typescript
cache: {
  excludeAuthenticatedRequests: true; // Don't cache user-specific data
}
```

### 4. Use Cache Prefixes

```typescript
cache: {
  keyPrefix: 'myapp:prod:'; // Separate dev/staging/prod caches
}
```

### 5. Monitor Cache Performance

```typescript
// Check cache stats regularly
const stats = await app.cache.getStats();
console.log(`Cache hit rate: ${stats.keyCount} keys`);
```

---

## Graceful Degradation

If Redis is unavailable:

- ✅ Application continues to work
- ✅ All requests go to database
- ✅ No errors thrown
- ⚠️ Performance degrades to non-cached levels

```
⚠️  Redis connection error: ECONNREFUSED
   Cache will be disabled, using database directly
```

---

## Troubleshooting

### Cache Not Working

**Check Redis connection:**

```bash
redis-cli ping
# Should return: PONG
```

**Check cache is enabled:**

```typescript
cache: {
  enabled: true; // Make sure this is true
}
```

**Check cache stats:**

```bash
curl http://localhost:3000/_cache/stats
```

### Cache Not Invalidating

**Check invalidation is enabled:**

```typescript
cache: {
  invalidation: {
    enabled: true;
  }
}
```

**Manually clear cache:**

```bash
curl -X POST http://localhost:3000/_cache/clear
```

### High Memory Usage

**Set shorter TTL:**

```typescript
cache: {
  ttl: 60; // 1 minute instead of 5
}
```

**Exclude large responses:**

```typescript
cache: {
  excludeRoutes: ['/api/large-data/*'];
}
```

---

## Advanced Usage

### Programmatic Cache Access

```typescript
// Access cache service directly
const cache = app.cache;

// Get value
const user = await cache.get('user:123');

// Set value
await cache.set('user:123', userData, 600);

// Delete value
await cache.delete('user:123');

// Delete pattern
await cache.deletePattern('user:*');

// Clear all
await cache.clear();
```

### Custom Cache Keys

The cache key format is:

```
{keyPrefix}{model}:{operation}:{id}:{filters}:{sort}:{page}:{limit}
```

Examples:

- `myapp:user:list:f:abc123:p:1:l:10`
- `myapp:user:get:123`
- `myapp:post:list:s:xyz789`

---

## Examples

### Example 1: Basic Caching

```typescript
const app = await initAllium({
  models,
  prisma: { datasourceUrl: process.env.DATABASE_URL },
  cache: {
    enabled: true,
    redis: { url: process.env.REDIS_URL },
  },
});
```

### Example 2: Production Configuration

```typescript
const app = await initAllium({
  models,
  prisma: { datasourceUrl: process.env.DATABASE_URL },
  cache: {
    enabled: process.env.NODE_ENV === 'production',
    redis: {
      url: process.env.REDIS_URL,
      password: process.env.REDIS_PASSWORD,
    },
    ttl: 600,
    keyPrefix: `${process.env.APP_NAME}:${process.env.NODE_ENV}:`,
    excludeRoutes: ['/api/admin/*', '/api/auth/*'],
    excludeAuthenticatedRequests: true,
  },
});
```

### Example 3: Development Setup

```typescript
const app = await initAllium({
  models,
  prisma: { datasourceUrl: process.env.DATABASE_URL },
  cache: {
    enabled: false, // Disable in development
  },
});
```

---

## See Also

- [Performance Guide](./PERFORMANCE.md)
- [Plugin Configuration](./plugin-configuration.md)
- [Connection Pooling](./CONNECTION_POOLING.md)

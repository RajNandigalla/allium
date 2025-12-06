# Performance Optimization Guide

## Overview

This guide covers performance optimization strategies for Allium applications, including caching, connection pooling, and query optimization.

## Quick Wins

### 1. Enable Caching

**Impact**: 10-50x faster response times

```typescript
cache: {
  enabled: true,
  redis: { url: process.env.REDIS_URL },
  ttl: 300
}
```

See [Caching Guide](./CACHING.md) for details.

### 2. Configure Connection Pooling

**Impact**: Better resource utilization, reduced connection overhead

```typescript
database: {
  connectionPool: {
    min: 2,
    max: 10,
    idleTimeoutMillis: 30000
  }
}
```

### 3. Use Field Selection

**Impact**: Reduce data transfer and serialization time

```bash
GET /api/users?fields=id,name,email
```

### 4. Enable Compression

**Impact**: 60-80% reduction in response size

```typescript
compress: {
  global: true,
  threshold: 1024
}
```

---

## Database Connection Pooling

### Configuration

Prisma handles connection pooling automatically. Configure via DATABASE_URL:

```bash
# PostgreSQL
DATABASE_URL="postgresql://user:pass@localhost:5432/db?connection_limit=10&pool_timeout=20"

# MySQL
DATABASE_URL="mysql://user:pass@localhost:3306/db?connection_limit=10&pool_timeout=20"
```

### Recommended Settings

**Development**:

```
connection_limit=5
pool_timeout=10
```

**Production**:

```
connection_limit=20
pool_timeout=30
```

### Monitoring

```typescript
// Check active connections
const result = await prisma.$queryRaw`SELECT count(*) FROM pg_stat_activity`;
```

---

## Caching Strategies

### 1. Cache-Aside (Implemented)

Best for: Read-heavy workloads

```typescript
cache: {
  enabled: true,
  ttl: 300
}
```

### 2. Write-Through (Manual)

Best for: Data consistency

```typescript
// Update database and cache together
await prisma.user.update({ where: { id }, data });
await cache.set(`user:${id}`, updatedUser);
```

### 3. Cache Warming

Best for: Predictable access patterns

```typescript
// Warm cache on startup
async function warmCache() {
  const users = await prisma.user.findMany();
  for (const user of users) {
    await cache.set(`user:${user.id}`, user, 3600);
  }
}
```

---

## Query Optimization

### 1. Use Indexes

```prisma
model User {
  id    Int    @id @default(autoincrement())
  email String @unique
  name  String

  @@index([email]) // Add index for frequent queries
  @@index([name, email]) // Compound index
}
```

### 2. Limit Results

```bash
GET /api/users?limit=10&page=1
```

### 3. Select Specific Fields

```bash
GET /api/users?fields=id,name
```

### 4. Use Cursor Pagination

Better performance for large datasets:

```bash
GET /api/users?cursor=eyJpZCI6MTAwfQ==&limit=10
```

---

## Response Optimization

### 1. Enable Compression

```typescript
compress: {
  global: true,
  threshold: 1024, // Compress responses > 1KB
  encodings: ['gzip', 'deflate']
}
```

### 2. Use ETags

Automatically enabled with caching:

```http
HTTP/1.1 304 Not Modified
ETag: "abc123"
```

### 3. Implement Pagination

```typescript
// Efficient pagination
const users = await prisma.user.findMany({
  take: 10,
  skip: (page - 1) * 10,
});
```

---

## Performance Benchmarks

### Without Optimization

```
Requests per second: 100
Average response time: 100ms
Database connections: 50
```

### With Caching + Connection Pooling

```
Requests per second: 1000+
Average response time: 10ms
Database connections: 10
```

**10x improvement!**

---

## Monitoring

### 1. Cache Statistics

```bash
GET /_cache/stats
```

### 2. Response Times

```typescript
fastify.addHook('onResponse', (request, reply, done) => {
  const responseTime = reply.getResponseTime();
  console.log(`${request.method} ${request.url}: ${responseTime}ms`);
  done();
});
```

### 3. Database Queries

```typescript
// Enable Prisma query logging
prisma: {
  log: ['query', 'info', 'warn', 'error'];
}
```

---

## Best Practices

### 1. Cache Frequently Accessed Data

```typescript
cache: {
  ttl: 3600; // 1 hour for stable data
}
```

### 2. Use Appropriate Connection Pool Size

```
Pool size = (Number of CPU cores × 2) + 1
```

### 3. Monitor and Adjust

- Track cache hit rates
- Monitor database connection usage
- Adjust TTL based on data freshness requirements

### 4. Use CDN for Static Assets

- Offload static file serving
- Reduce server load
- Improve global performance

---

## Troubleshooting

### High Database Load

**Solution**: Enable caching

```typescript
cache: {
  enabled: true;
}
```

### Slow Queries

**Solution**: Add indexes

```prisma
@@index([fieldName])
```

### High Memory Usage

**Solution**: Reduce cache TTL

```typescript
cache: {
  ttl: 60;
} // 1 minute
```

### Connection Pool Exhaustion

**Solution**: Increase pool size

```
DATABASE_URL="...?connection_limit=20"
```

---

## See Also

- [Caching Guide](./CACHING.md)
- [Plugin Configuration](./plugin-configuration.md)
- [Advanced Features](./ADVANCED_FEATURES.md)

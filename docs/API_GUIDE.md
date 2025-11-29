# API Creation & Versioning Guide

## 1. Creating a New API

There are two ways to create APIs in Allium:

### A. Auto-Generated Model APIs (Recommended)

For standard CRUD operations backed by a database table.

**Method:** Define a model using `registerModel` or JSON.

```typescript
// packages/core/src/models/Post.ts
registerModel('Post', {
  fields: [
    { name: 'title', type: 'String' },
    { name: 'content', type: 'String' },
  ],
  api: {
    prefix: '/api/v1/posts', // Optional: Custom path
    operations: ['create', 'read', 'list'], // Optional: Limit operations
  },
});
```

**Result:**

- `POST /api/v1/posts`
- `GET /api/v1/posts`
- `GET /api/v1/posts/:id`

### B. Custom Routes

For custom logic, external integrations, or non-CRUD endpoints.

**Method:** Create a Fastify plugin and register it in `initAllium`.

1. **Create Plugin:**

```typescript
// src/routes/custom.ts
import { FastifyPluginAsync } from 'fastify';

const customRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.get('/api/custom/hello', async (request, reply) => {
    return { message: 'Hello from custom route!' };
  });
};

export default customRoutes;
```

2. **Register in App:**

```typescript
// src/app.ts
import customRoutes from './routes/custom';

const app = await initAllium({
  models,
  prisma: { ... },
  plugins: [
    customRoutes // Register here!
  ]
});
```

**Result:**

- `GET /api/custom/hello`

---

## 2. API Versioning

### A. Versioning Model APIs

Use the `prefix` configuration to namespace your models.

**Version 1:**

```typescript
registerModel('User', {
  api: { prefix: '/api/v1/users' },
});
```

**Version 2 (New Model):**

```typescript
registerModel('UserV2', {
  api: { prefix: '/api/v2/users' },
});
```

### B. Versioning Custom Routes

Use directory structure or route prefixes.

**Directory Structure:**

**Directory Structure:**

```
src/routes/
  ├── v1/
  │   └── auth.ts  -> /api/v1/auth
  └── v2/
      └── auth.ts  -> /api/v2/auth
```

**Route Prefix:**

```typescript
// src/routes/v1/auth.ts
const authRoutes: FastifyPluginAsync = async (fastify, opts) => {
  fastify.register(
    async (v1) => {
      v1.post('/login', loginHandler);
    },
    { prefix: '/api/v1/auth' }
  );
};
```

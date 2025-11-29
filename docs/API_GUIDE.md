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

## 3. Scenario: Creating a V2 API

Let's say you have `User` (v1) and you want to create a breaking change for v2.

### Option A: New Model (Recommended for Schema Changes)

If the database schema changes significantly (e.g., splitting `name` into `firstName` and `lastName`).

1. **Keep V1 Model:**

```typescript
// src/models/User.ts
registerModel('User', {
  api: { prefix: '/api/v1/users' },
  // ... fields: name
});
```

2. **Create V2 Model:**

```typescript
// src/models/UserV2.ts
registerModel('UserV2', {
  api: { prefix: '/api/v2/users' },
  fields: [
    { name: 'firstName', type: 'String' },
    { name: 'lastName', type: 'String' },
  ],
});
```

### Option B: Custom Route (Recommended for Logic Changes)

If the schema is the same but the response format or logic changes.

1. **Create V2 Plugin:**

```typescript
// src/routes/v2/users.ts
const userV2Routes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (req) => {
    // Custom V2 logic returning different format
    return { version: 2, data: [] };
  });
};
export default userV2Routes;
```

2. **Register with Prefix:**

```typescript
// src/app.ts
initAllium({
  plugins: [[userV2Routes, { prefix: '/api/v2/users' }]],
});
```

## 4. Swagger Documentation

Custom routes automatically appear in Swagger if you define a `schema`.

```typescript
// src/routes/custom.ts
const customRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get(
    '/hello',
    {
      schema: {
        tags: ['Custom'], // Group name in Swagger
        summary: 'Returns a hello message',
        response: {
          200: {
            type: 'object',
            properties: {
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (req) => {
      return { message: 'Hello!' };
    }
  );
};
```

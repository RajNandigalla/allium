# @allium/fastify

A powerful, opinionated Fastify framework for building type-safe REST APIs with Prisma.

## Features

- 🚀 **Auto-generated CRUD Routes**: Instantly generate RESTful endpoints for your Prisma models.
- 📚 **Automatic Swagger/OpenAPI**: Zero-config API documentation.
- 🪝 **Lifecycle Hooks**: Intercept and modify data with `beforeCreate`, `afterFind`, etc.
- 🔌 **Modular Plugin Architecture**: Built on Fastify's plugin system, fully compatible with `fastify-autoload`.
- 🛡️ **Type-Safe**: Built with TypeScript and Prisma for end-to-end type safety.
- 🗑️ **Soft Deletes**: Built-in support for soft deletion with restore capabilities.
- 📝 **Audit Trails**: Automatic tracking of `createdBy`, `updatedBy`, and `deletedBy`.
- ⚡ **Built-in Caching**: Redis-backed caching for high performance.
- 🕸️ **GraphQL Support**: Optional GraphQL endpoint integration.

## Installation

```bash
npm install @allium/fastify fastify @prisma/client
npm install -D prisma typescript @types/node
```

## Quick Start

### 1. Setup Prisma

Create a `prisma/schema.prisma` file:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
}
```

For Prisma 7+, create a `prisma.config.js`:

```javascript
module.exports = {
  datasource: {
    url: 'file:./dev.db',
  },
};
```

Run migrations:

```bash
npx prisma generate
npx prisma db push
```

### 2. Define Your Models

### 2. Define Your Models

1. Create a JSON definition in `.allium/models/user.json`:

```json
{
  "name": "User",
  "softDelete": true,
  "auditTrail": true,
  "fields": [
    { "name": "email", "type": "String", "unique": true },
    { "name": "name", "type": "String" }
  ],
  "hooks": {
    "beforeCreate": "logCreation"
  }
}
```

2. Register the model and hooks in `src/models/user.model.ts`:

```typescript
import { registerModel } from '@allium/core';

export const User = registerModel('User', {
  functions: {
    logCreation: async (data, context) => {
      context.logger.info('Creating new user...');
      return data;
    },
  },
});
```

### 3. Create the Server

You can use the helper function for a quick setup:

```typescript
import { createAlliumApp } from '@allium/fastify';
import { User } from './models';

async function start() {
  const app = await createAlliumApp({
    models: [User],
    prisma: {
      datasourceUrl: 'file:./dev.db',
      provider: 'sqlite',
      log: true,
    },
    server: {
      logger: true,
    },
    // Optional extras
    caching: {
      enable: true,
      provider: 'memory', // or 'redis'
      ttl: 300,
    },
    graphql: true, // Enable /graphql endpoint
  });

  await app.listen({ port: 3000 });
  console.log('Server running at http://localhost:3000');
}

start();
```

Or use `fastify-autoload` (recommended for larger apps):

```typescript
// app.ts
import { join } from 'path';
import AutoLoad from '@fastify/autoload';
import { FastifyPluginAsync } from 'fastify';
import { User } from './models';

const app: FastifyPluginAsync = async (fastify, opts) => {
  // Load plugins (including allium and prisma)
  void fastify.register(AutoLoad, {
    dir: join(__dirname, 'plugins'),
    options: {
      ...opts,
      // Pass configuration to plugins
      models: [User],
      prisma: {
        datasourceUrl: 'file:./dev.db',
        provider: 'sqlite',
      },
    },
  });
};

export default app;
```

## Architecture

Allium is built as a set of composable Fastify plugins:

1.  **`prismaPlugin`**: Manages the database connection and decorates the Fastify instance with `prisma`.
2.  **`swaggerPlugin`**: Sets up Swagger UI.
3.  **`alliumPlugin`**: The core orchestrator. It:
    - Introspects your models.
    - Registers Swagger schemas via `modelSchemasPlugin`.
    - Generates CRUD routes via `modelRoutesPlugin`.

### Dependency Order

Plugins must be loaded in this order:

1.  `prisma` & `swagger`
2.  `allium` (depends on the above)

If using `fastify-autoload`, this is handled automatically via plugin dependencies.

## API Reference

For a model named `User`, the following endpoints are generated:

| Method   | Endpoint                | Description                                 |
| :------- | :---------------------- | :------------------------------------------ |
| `POST`   | `/api/user`             | Create a new user                           |
| `GET`    | `/api/user`             | List users (pagination, sorting, filtering) |
| `GET`    | `/api/user/:id`         | Get user by ID                              |
| `PATCH`  | `/api/user/:id`         | Update user by ID                           |
| `DELETE` | `/api/user/:id`         | Delete user by ID (or Soft Delete)          |
| `POST`   | `/api/user/:id/restore` | Restore soft-deleted user                   |
| `DELETE` | `/api/user/:id/force`   | Permanently delete user                     |

### Query Parameters (List)

**Pagination:**

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Filtering** (Strapi-style):

- `filters[field][$eq]=value` - Equals
- `filters[field][$ne]=value` - Not equals
- `filters[field][$gt]=value` - Greater than
- `filters[field][$gte]=value` - Greater than or equal
- `filters[field][$lt]=value` - Less than
- `filters[field][$lte]=value` - Less than or equal
- `filters[field][$contains]=value` - Contains substring
- `filters[field][$startsWith]=value` - Starts with
- `filters[field][$endsWith]=value` - Ends with
- `filters[field][$in]=val1,val2` - In array

**Examples:**

```bash
# Find users with age > 18
GET /api/user?filters[age][$gt]=18

# Find users with name containing "John"
GET /api/user?filters[name][$contains]=John

# Combine multiple filters
GET /api/user?filters[age][$gte]=21&filters[role][$eq]=admin
```

**Sorting:**

- `sort[0]=field:order` - Primary sort
- `sort[1]=field:order` - Secondary sort
- Order: `asc` or `desc`

**Examples:**

```bash
# Sort by name ascending
GET /api/user?sort[0]=name:asc

# Sort by role, then createdAt
GET /api/user?sort[0]=role:asc&sort[1]=createdAt:desc
```

## Field Configuration

You can define validation rules, enums, and default values directly in your model definition:

````typescript
```json
{
  "name": "User",
  "fields": [
    {
      "name": "role",
      "type": "Enum",
      "values": ["user", "admin", "moderator"],
      "default": "user"
    },
    {
      "name": "email",
      "type": "String",
      "unique": true,
      "validation": {
        "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
      }
    },
    {
      "name": "age",
      "type": "Int",
      "validation": {
        "min": 18,
        "max": 100
      }
    }
  ]
}
````

**Features:**

- **Validation**: `min`, `max`, `minLength`, `maxLength`, `pattern`, `enum`.
- **Enums**: Automatically generates Prisma enums and validates values at runtime.
- **Defaults**: Automatically applied if field is missing in request.
- **Private Fields**: Mark fields as `private: true` to exclude from API responses.

**Private Fields Example:**

````typescript
```json
{
  "name": "User",
  "fields": [
    {
      "name": "password",
      "type": "String",
      "private": true
    },
    {
      "name": "apiKey",
      "type": "String",
      "private": true
    }
  ]
}
````

Private fields are automatically excluded from all CRUD responses (CREATE, LIST, GET, UPDATE) but remain accessible for internal queries and updates.

## Computed/Virtual Fields

Define calculated fields that appear in API responses but are NOT stored in the database.

**Template-based** (works in JSON & TypeScript):

**Template-based** (JSON):

```json
{
  "name": "User",
  "fields": [
    { "name": "firstName", "type": "String" },
    { "name": "lastName", "type": "String" },
    {
      "name": "fullName",
      "type": "String",
      "virtual": true,
      "computed": {
        "template": "{firstName} {lastName}"
      }
    }
  ]
}
```

**Function-based** (JSON + TypeScript):

1. Define in JSON:

```json
{
  "name": "Product",
  "fields": [
    { "name": "price", "type": "Float" },
    {
      "name": "priceWithTax",
      "type": "Float",
      "virtual": true,
      "computed": {
        "transform": "calculateTax"
      }
    }
  ]
}
```

2. Implement in TypeScript:

```typescript
registerModel('Product', {
  functions: {
    calculateTax: (record) => record.price * 1.1,
  },
});
```

**Key Points:**

- Virtual fields are computed at runtime, never stored in DB
- Cannot query or sort by virtual fields
- Use `virtual: true` flag for identification
- Use `virtual: true` flag for identification
- `virtual: true` flag for identification

## Compound Unique Constraints

Enforce uniqueness across multiple fields at the database level to prevent duplicate combinations.

**Example** (Likes - prevent liking the same post twice):

````typescript
```json
{
  "name": "Like",
  "fields": [
    { "name": "userId", "type": "String" },
    { "name": "postId", "type": "String" }
  ],
  "constraints": {
    "unique": [["userId", "postId"]]
  }
}
````

**Generated Prisma Schema:**

```prisma
model Like {
  id        String   @id @default(uuid())
  userId    String
  postId    String

  @@unique([userId, postId])
}
```

**Multiple Constraints:**

```typescript
constraints: {
  unique: [
    ['userId', 'postId'], // Can't like same post twice
    ['email', 'tenantId'], // Email unique per tenant
  ];
}
```

**Common Use Cases:**

- **Likes/Reactions**: `[userId, postId]`
- **Multi-Tenant Apps**: `[email, tenantId]`
- **Subscriptions**: `[year, month, userId]`

- **Subscriptions**: `[year, month, userId]`

- **Subscriptions**: `[year, month, userId]`

## Compound Indexes

Optimize query performance with multi-field database indexes.

````typescript
```json
{
  "name": "Post",
  "fields": [
    { "name": "userId", "type": "String" },
    { "name": "createdAt", "type": "DateTime" }
  ],
  "constraints": {
    "indexes": [["userId", "createdAt"]]
  }
}
````

**Generated Prisma:**

```prisma
@@index([userId, createdAt])
```

**Common Use Cases:**

- **User Posts**: `[userId, createdAt]` - Fast queries for recent posts
- **Search**: `[category, status]` - Filtered listings
- **Analytics**: `[date, eventType]` - Time-series queries

- **Analytics**: `[date, eventType]` - Time-series queries

## Enable/Disable CRUD Operations

Selectively enable or disable API endpoints per model.

````typescript
```json
{
  "name": "Config",
  "fields": [
    { "name": "key", "type": "String" },
    { "name": "value", "type": "String" }
  ],
  "api": {
    "operations": ["read", "list"]
  }
}
````

**Available Operations:**

- `create`: POST /api/{model}
- `list`: GET /api/{model}
- `read`: GET /api/{model}/:id
- `update`: PATCH /api/{model}/:id
- `delete`: DELETE /api/{model}/:id

**Behavior:**

- Disabled operations return `404 Not Found`
- If `operations` is omitted, ALL operations are enabled by default

- Disabled operations return `404 Not Found`
- If `operations` is omitted, ALL operations are enabled by default

## Custom Route Prefixes

Override the default `/api/{model}` path for specific models.

````typescript
```json
{
  "name": "Auth",
  "fields": [],
  "api": {
    "prefix": "/api/v1/auth"
  }
}
````

**Resulting Routes:**

- `GET /api/v1/auth`
- `POST /api/v1/auth`
- `GET /api/v1/auth/:id`
- ...

- `GET /api/v1/auth/:id`
- ...

## Custom Plugins & Routes

Register your own Fastify plugins and routes alongside Allium.

```typescript
import customRoutes from './routes/custom';

const app = await initAllium({
  models,
  prisma: { ... },

  // Register custom plugins
  plugins: [
    customRoutes,
    [require('@fastify/websocket'), { options: 'here' }]
  ]
});
```

## Masked Fields

Automatically mask sensitive data in API responses while preserving full values in the database.

**Preset Patterns:**

````typescript
```json
{
  "name": "User",
  "fields": [
    { "name": "creditCard", "type": "String", "masked": "creditCard" },
    { "name": "ssn", "type": "String", "masked": "ssn" },
    { "name": "phone", "type": "String", "masked": "phone" },
    { "name": "email", "type": "String", "masked": "email" }
  ]
}
````

**Custom Configuration:**

```typescript
{
  name: 'apiKey',
  type: 'String',
  masked: {
    pattern: '*',
    visibleStart: 4,
    visibleEnd: 4
  } // Output: sk_t****************abcd
}
```

**Custom Function:**

```json
{
  "name": "secretCode",
  "type": "String",
  "masked": "customMaskFn"
}
```

}

````

## JSON Field Support

Validate JSON fields with schemas and filter by nested properties.

**Schema Validation:**
```typescript
```json
{
  "name": "Config",
  "fields": [
    {
      "name": "metadata",
      "type": "Json",
      "jsonSchema": {
        "type": "object",
        "required": ["theme"],
        "properties": {
          "theme": { "type": "string", "enum": ["light", "dark"] }
        }
      }
    }
  ]
}
````

**Nested Filtering:**

```bash
GET /api/config?filters[metadata.theme][$eq]=dark
```

GET /api/config?filters[metadata.theme][$eq]=dark

````

## Encrypted Fields

Automatically encrypt sensitive data at rest using AES-256-GCM.

**Usage:**
```typescript
```json
{
  "name": "User",
  "fields": [
    {
      "name": "stripeKey",
      "type": "String",
      "encrypted": true
    }
  ]
}
````

**Environment:**

```bash
ENCRYPTION_KEY=your-32-character-secret-key-here-minimum
```

**Behavior:**

- **On Write**: `"sk_test_123"` → Stored as encrypted base64
- **On Read**: Encrypted base64 → `"sk_test_123"`

**Security Notes:**

- Uses AES-256-GCM with PBKDF2 key derivation
- Unique salt and IV per encryption
- Store `ENCRYPTION_KEY` securely (env vars, secrets manager)

## Soft Deletes & Audit Trails

Enable these features in `registerModel`:

````typescript
```json
{
  "name": "User",
  "softDelete": true,
  "auditTrail": true
}
````

**Soft Deletes:**

- `DELETE` endpoint sets `deletedAt` instead of removing record.
- `GET` endpoints filter out records where `deletedAt` is not null.
- Use `POST /:id/restore` to recover records.
- Use `DELETE /:id/force` to permanently delete.

**Audit Trails:**

- Automatically populates `createdBy` and `updatedBy` from `request.user.id`.
- Automatically populates `createdBy` and `updatedBy` from `request.user.id`.
- Populates `deletedBy` on soft delete.

## Relationship Cascades

Ensure data integrity by automatically deleting related records.

````typescript
```json
{
  "name": "Post",
  "fields": [
    {
      "name": "user",
      "type": "Relation",
      "model": "User",
      "relation": { "onDelete": "Cascade" }
    }
  ]
}
````

**Supported Actions:**

- `Cascade`: Delete children (Hard or Soft delete based on child model).
- `SetNull`: Set FK to null.
- `Restrict`: Prevent deletion.
- `NoAction`: Database error.

**Soft Delete Cascading:**
If you soft-delete a parent (e.g., `User`), Allium automatically finds and soft-deletes related children (e.g., `Post`) that have `onDelete: 'Cascade'`. No database triggers required!

## Rate Limiting

Protect your APIs from abuse with configurable rate limits.

### Global Configuration

Set default limits for all routes:

```typescript
initAllium({
  rateLimit: {
    max: 100,
    timeWindow: '1 minute',
  },
});
```

### Per-Model Configuration

Override limits for specific models:

````typescript
```json
{
  "name": "Auth",
  "api": {
    "rateLimit": {
      "max": 5,
      "timeWindow": "1 minute"
    }
  }
}
````

**JSON:**

```json
{
  "name": "Auth",
  "api": {
    "rateLimit": {
      "max": 5,
      "timeWindow": "1 minute"
    }
  }
}
```

**Behavior:**

- Returns `429 Too Many Requests` when limit exceeded.
- Tracks limits per client IP.
- Custom routes can use Fastify's native `config.rateLimit`.

## Caching

Speed up your API with built-in caching support.

```typescript
initAllium({
  caching: {
    enable: true,
    provider: 'redis', // 'memory' for dev, 'redis' for prod
    redisUrl: process.env.REDIS_URL,
    ttl: 300, // 5 minutes default
    max: 1000, // Max items in memory cache
    excludeRoutes: ['/api/health', '/api/metrics'], // Skip caching for these
  },
});
```

- **Smart Invalidation**: Creating, updating, or deleting a record automatically invalidates relevant cache entries (lists and individual records).
- **Control**: Use `excludeRoutes` to bypass cache for sensitive or real-time endpoints.

## GraphQL

Enable a GraphQL endpoint alongside your REST API.

```typescript
initAllium({
  graphql: true,
});
```

Access the playground at `/graphql`.

## API Documentation (Swagger)

Swagger UI is automatically generated and available at `/documentation`. It reflects your current models, fields, and enabled operations.

## Analytics

Allium includes a built-in, low-overhead analytics system.

- **Automatic Tracking**: Capture data on every request (Method, Path, Status, Latency).
- **Zero Config**: Works automatically if the `ApiMetric` model exists.
- **Async Logging**: Does not impact API response time.

👉 [**Read the full Analytics Guide**](../../docs/guides/ANALYTICS.md)

## Cursor-based Pagination

Efficient pagination for large datasets. **Cursor-based pagination is now the default** for all list endpoints.

### Default behavior (Cursor-based)

```bash
# First page - no cursor needed
GET /api/users?limit=10

# Next page - use cursor from previous response
GET /api/users?cursor=eyJpZCI6IjEyMyJ9&limit=10
```

**Response:**

```json
{
  "data": [...],
  "pagination": {
    "nextCursor": "eyJpZCI6IjQ1NiJ9",
    "hasMore": true,
    "limit": 10
  }
}
```

### Offset-based (Backward compatible)

To use offset-based pagination, explicitly provide a `page` parameter:

```bash
GET /api/users?page=2&limit=10
```

**Response:**

```json
{
  "data": [...],
  "pagination": {
    "page": 2,
    "limit": 10,
    "total": 100
  }
}
```

**Benefits:**

- No skipped/duplicate records when data changes
- More efficient for large datasets
- Perfect for infinite scroll
- **Default behavior** - no configuration needed

## Lifecycle Hooks

Hooks allow you to execute custom logic during the CRUD lifecycle.

Available hooks:

- `beforeCreate(data, context)`
- `afterCreate(result, context)`
- `beforeFind(query, context)`
- `afterFind(result, context)`
- `beforeUpdate(id, data, context)`
- `afterUpdate(result, previousData, context)`
- `beforeDelete(id, context)`
- `afterDelete(id, record, context)`

````typescript
```typescript
registerModel('User', {
  functions: {
    beforeCreate: async (data, { request, logger }) => {
      // Access Fastify request object
      if (!request.user.isAdmin) {
        throw new Error('Unauthorized');
      }
      return data;
    },
  },
});
````

## License

ISC

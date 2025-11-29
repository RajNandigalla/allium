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

Define your models and optional hooks:

```typescript
import { registerModel } from '@allium/core';

export const User = registerModel('User', {
  softDelete: true,
  auditTrail: true,
  hooks: {
    beforeCreate: async (data, context) => {
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

```typescript
registerModel('User', {
  fields: [
    {
      name: 'role',
      type: 'Enum',
      values: ['user', 'admin', 'moderator'],
      default: 'user',
    },
    {
      name: 'email',
      type: 'String',
      unique: true,
      validation: {
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
      },
    },
    {
      name: 'age',
      type: 'Int',
      validation: {
        min: 18,
        max: 100,
      },
    },
  ],
});
```

**Features:**

- **Validation**: `min`, `max`, `minLength`, `maxLength`, `pattern`, `enum`.
- **Enums**: Automatically generates Prisma enums and validates values at runtime.
- **Defaults**: Automatically applied if field is missing in request.
- **Private Fields**: Mark fields as `private: true` to exclude from API responses.

**Private Fields Example:**

```typescript
registerModel('User', {
  fields: [
    {
      name: 'password',
      type: 'String',
      private: true, // Never returned in API responses
    },
    {
      name: 'apiKey',
      type: 'String',
      private: true,
    },
  ],
});
```

Private fields are automatically excluded from all CRUD responses (CREATE, LIST, GET, UPDATE) but remain accessible for internal queries and updates.

## Computed/Virtual Fields

Define calculated fields that appear in API responses but are NOT stored in the database.

**Template-based** (works in JSON & TypeScript):

```typescript
registerModel('User', {
  fields: [
    { name: 'firstName', type: 'String' },
    { name: 'lastName', type: 'String' },
    {
      name: 'fullName',
      type: 'String',
      virtual: true,
      computed: {
        template: '{firstName} {lastName}', // Supports nested paths like {address.city}
      },
    },
  ],
});
```

**Function-based** (TypeScript `registerModel` only):

```typescript
registerModel('Product', {
  fields: [
    { name: 'price', type: 'Float' },
    {
      name: 'priceWithTax',
      type: 'Float',
      virtual: true,
      hasTransform: true,
      computed: {
        transform: (record) => record.price * 1.1,
      },
    },
  ],
});
```

**Key Points:**

- Virtual fields are computed at runtime, never stored in DB
- Cannot query or sort by virtual fields
- Use `virtual: true` flag for identification
- Use `virtual: true` flag for identification
- `hasTransform: true` indicates custom function logic (for introspection)

## Compound Unique Constraints

Enforce uniqueness across multiple fields at the database level to prevent duplicate combinations.

**Example** (Likes - prevent liking the same post twice):

```typescript
registerModel('Like', {
  fields: [
    { name: 'userId', type: 'String' },
    { name: 'postId', type: 'String' },
  ],
  constraints: {
    unique: [['userId', 'postId']],
  },
});
```

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

```typescript
registerModel('Post', {
  fields: [
    { name: 'userId', type: 'String' },
    { name: 'createdAt', type: 'DateTime' },
  ],
  constraints: {
    indexes: [['userId', 'createdAt']],
  },
});
```

**Generated Prisma:**

```prisma
@@index([userId, createdAt])
```

**Common Use Cases:**

- **User Posts**: `[userId, createdAt]` - Fast queries for recent posts
- **Search**: `[category, status]` - Filtered listings
- **Analytics**: `[date, eventType]` - Time-series queries

## Masked Fields

Automatically mask sensitive data in API responses while preserving full values in the database.

**Preset Patterns:**

```typescript
registerModel('User', {
  fields: [
    { name: 'creditCard', type: 'String', masked: 'creditCard' }, // ****-****-****-1234
    { name: 'ssn', type: 'String', masked: 'ssn' }, // ***-**-1234
    { name: 'phone', type: 'String', masked: 'phone' }, // ***-***-5678
    { name: 'email', type: 'String', masked: 'email' }, // j***@example.com
  ],
});
```

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

```typescript
{
  name: 'secretCode',
  type: 'String',
  hasMaskTransform: true, // Indicates custom logic (for introspection)
  masked: (val) => `SECRET-${val.slice(-4)}` // Output: SECRET-5678
}
```

}

````

## JSON Field Support

Validate JSON fields with schemas and filter by nested properties.

**Schema Validation:**
```typescript
registerModel('Config', {
  fields: [
    {
      name: 'metadata',
      type: 'Json',
      jsonSchema: {
        type: 'object',
        required: ['theme'],
        properties: {
          theme: { type: 'string', enum: ['light', 'dark'] }
        }
      }
    }
  ]
});
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
registerModel('User', {
  fields: [
    {
      name: 'stripeKey',
      type: 'String',
      encrypted: true
    }
  ]
});
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

```typescript
registerModel('User', {
  softDelete: true, // Adds deletedAt, enables restore/forceDelete
  auditTrail: true, // Adds createdBy, updatedBy, deletedBy
});
```

**Soft Deletes:**

- `DELETE` endpoint sets `deletedAt` instead of removing record.
- `GET` endpoints filter out records where `deletedAt` is not null.
- Use `POST /:id/restore` to recover records.
- Use `DELETE /:id/force` to permanently delete.

**Audit Trails:**

- Automatically populates `createdBy` and `updatedBy` from `request.user.id`.
- Populates `deletedBy` on soft delete.

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

```typescript
registerModel('User', {
  beforeCreate: async (data, { request, logger }) => {
    // Access Fastify request object
    if (!request.user.isAdmin) {
      throw new Error('Unauthorized');
    }
    return data;
  },
});
```

## License

ISC

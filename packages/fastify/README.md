# @allium/fastify

A powerful, opinionated Fastify framework for building type-safe REST APIs with Prisma.

## Features

- 🚀 **Auto-generated CRUD Routes**: Instantly generate RESTful endpoints for your Prisma models.
- 📚 **Automatic Swagger/OpenAPI**: Zero-config API documentation.
- 🪝 **Lifecycle Hooks**: Intercept and modify data with `beforeCreate`, `afterFind`, etc.
- 🔌 **Modular Plugin Architecture**: Built on Fastify's plugin system, fully compatible with `fastify-autoload`.
- 🛡️ **Type-Safe**: Built with TypeScript and Prisma for end-to-end type safety.

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
  beforeCreate: async (data, context) => {
    context.logger.info('Creating new user...');
    return data;
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

| Method   | Endpoint        | Description                                 |
| :------- | :-------------- | :------------------------------------------ |
| `POST`   | `/api/user`     | Create a new user                           |
| `GET`    | `/api/user`     | List users (pagination, sorting, filtering) |
| `GET`    | `/api/user/:id` | Get user by ID                              |
| `PATCH`  | `/api/user/:id` | Update user by ID                           |
| `DELETE` | `/api/user/:id` | Delete user by ID                           |

### Query Parameters (List)

- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `sort`: Sort field and order (e.g., `createdAt:desc`)
- `filter`: JSON string for filtering

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

# Example: Product Model with Lifecycle Hooks

This example demonstrates the new Allium schema-first API with lifecycle hooks.

## Setup

```bash
# 1. Create Prisma schema
mkdir -p example-app/prisma
cd example-app
npm init -y
npm install @allium/core @allium/fastify @prisma/client prisma
```

## Prisma Schema

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
}

model Product {
  id          String   @id @default(uuid())
  name        String
  price       Float
  description String?
  inStock     Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Model Registration

```typescript
// src/models/product.model.ts
import { registerModel } from '@allium/core';

export const Product = registerModel('Product', {
  // Validate before creating
  beforeCreate: async (data, context) => {
    if (data.price < 0) {
      throw new Error('Price must be positive');
    }
    // Auto-generate slug
    data.slug = data.name.toLowerCase().replace(/\s+/g, '-');
    return data;
  },

  // Log after creation
  afterCreate: async (product, context) => {
    context.logger.info(`Product created: ${product.name}`);
  },
});
```

## Application

```typescript
// src/app.ts
import { createAlliumApp } from '@allium/fastify';
import { Product } from './models/product.model';

async function start() {
  const app = await createAlliumApp({
    models: [Product],
  });

  await app.listen({ port: 3000 });
  console.log('Server running on http://localhost:3000');
}

start();
```

## Run

```bash
npx prisma db push
npx prisma generate
npm run dev
```

## Auto-Generated Endpoints

- `GET /api/product` - List all products
- `GET /api/product/:id` - Get product by ID
- `POST /api/product` - Create product
- `PUT /api/product/:id` - Update product
- `DELETE /api/product/:id` - Delete product
- `GET /documentation` - Swagger UI
- `GET /health` - Health check

## Test

```bash
# Create a product
curl -X POST http://localhost:3000/api/product \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Product","price":29.99}'

# List products
curl http://localhost:3000/api/product
```

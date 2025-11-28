# Prisma Setup and Usage Guide

## Quick Start Guide

### Step 1: Initialize Prisma Schema

First, create a Prisma schema file if you don't have one:

```bash
# Create prisma directory
mkdir prisma

# Create schema file
touch prisma/schema.prisma
```

### Step 2: Define Your Schema

Edit `prisma/schema.prisma`:

```prisma
// Generator - tells Prisma to generate the client
generator client {
  provider = "prisma-client-js"
}

// Datasource - your database connection
datasource db {
  provider = "sqlite"  // or "mongodb", "postgresql", "mysql"
  url      = env("DATABASE_URL")
}

// Your models (tables)
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Post {
  id        String   @id @default(uuid())
  title     String
  content   String?
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Step 3: Set Environment Variables

Create `.env` file in your project root:

```bash
# For SQLite
DATABASE_URL="file:./dev.db"

# For MongoDB
# DATABASE_URL="mongodb://localhost:27017/mydb"

# For PostgreSQL
# DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"

# For MySQL
# DATABASE_URL="mysql://user:password@localhost:3306/mydb"
```

### Step 4: Generate Prisma Client

```bash
# Generate the Prisma Client based on your schema
npx prisma generate

# Push schema to database (creates tables)
npx prisma db push

# Or use migrations for production
npx prisma migrate dev --name init
```

---

## Using Prisma in Fastify Routes

### Basic CRUD Operations

```typescript
import { FastifyPluginAsync } from 'fastify';

const userRoutes: FastifyPluginAsync = async (fastify) => {
  // CREATE - Add new user
  fastify.post('/users', async (request, reply) => {
    const { email, name } = request.body as { email: string; name?: string };

    const user = await fastify.prisma.user.create({
      data: {
        email,
        name,
      },
    });

    return user;
  });

  // READ - Get all users
  fastify.get('/users', async (request, reply) => {
    const users = await fastify.prisma.user.findMany({
      include: {
        posts: true, // Include related posts
      },
    });

    return users;
  });

  // READ - Get single user
  fastify.get('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    const user = await fastify.prisma.user.findUnique({
      where: { id },
      include: {
        posts: true,
      },
    });

    if (!user) {
      return reply.status(404).send({ error: 'User not found' });
    }

    return user;
  });

  // UPDATE - Update user
  fastify.patch('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const { email, name } = request.body as { email?: string; name?: string };

    const user = await fastify.prisma.user.update({
      where: { id },
      data: {
        email,
        name,
      },
    });

    return user;
  });

  // DELETE - Delete user
  fastify.delete('/users/:id', async (request, reply) => {
    const { id } = request.params as { id: string };

    await fastify.prisma.user.delete({
      where: { id },
    });

    return { message: 'User deleted successfully' };
  });
};

export default userRoutes;
```

---

## Advanced Queries

### Filtering

```typescript
// Find users with specific email
const users = await fastify.prisma.user.findMany({
  where: {
    email: {
      contains: '@gmail.com', // Email contains @gmail.com
    },
  },
});

// Multiple conditions
const users = await fastify.prisma.user.findMany({
  where: {
    AND: [{ email: { contains: '@gmail.com' } }, { name: { not: null } }],
  },
});
```

### Sorting

```typescript
const users = await fastify.prisma.user.findMany({
  orderBy: {
    createdAt: 'desc', // Newest first
  },
});

// Multiple sort fields
const users = await fastify.prisma.user.findMany({
  orderBy: [{ name: 'asc' }, { createdAt: 'desc' }],
});
```

### Pagination

```typescript
const page = 1;
const pageSize = 10;

const users = await fastify.prisma.user.findMany({
  skip: (page - 1) * pageSize,
  take: pageSize,
});

// Get total count for pagination
const total = await fastify.prisma.user.count();
```

### Relations

```typescript
// Create user with posts
const user = await fastify.prisma.user.create({
  data: {
    email: 'john@example.com',
    name: 'John Doe',
    posts: {
      create: [
        { title: 'First Post', content: 'Hello World' },
        { title: 'Second Post', content: 'Another post' },
      ],
    },
  },
  include: {
    posts: true,
  },
});

// Find users with published posts
const users = await fastify.prisma.user.findMany({
  where: {
    posts: {
      some: {
        published: true,
      },
    },
  },
  include: {
    posts: {
      where: {
        published: true,
      },
    },
  },
});
```

### Aggregations

```typescript
// Count users
const userCount = await fastify.prisma.user.count();

// Count with conditions
const gmailUsers = await fastify.prisma.user.count({
  where: {
    email: {
      contains: '@gmail.com',
    },
  },
});

// Aggregate
const stats = await fastify.prisma.post.aggregate({
  _count: true,
  _avg: {
    viewCount: true,
  },
});
```

---

## Transactions

```typescript
// Simple transaction
const result = await fastify.prisma.$transaction([
  fastify.prisma.user.create({
    data: { email: 'user1@example.com', name: 'User 1' },
  }),
  fastify.prisma.user.create({
    data: { email: 'user2@example.com', name: 'User 2' },
  }),
]);

// Interactive transaction
const result = await fastify.prisma.$transaction(async (tx) => {
  const user = await tx.user.create({
    data: { email: 'john@example.com', name: 'John' },
  });

  const post = await tx.post.create({
    data: {
      title: 'First Post',
      authorId: user.id,
    },
  });

  return { user, post };
});
```

---

## Error Handling

```typescript
import { Prisma } from '@prisma/client';

fastify.post('/users', async (request, reply) => {
  try {
    const { email, name } = request.body as { email: string; name?: string };

    const user = await fastify.prisma.user.create({
      data: { email, name },
    });

    return user;
  } catch (error) {
    // Handle unique constraint violation
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return reply.status(409).send({
          error: 'A user with this email already exists',
        });
      }
    }

    // Handle other errors
    fastify.log.error(error);
    return reply.status(500).send({ error: 'Internal server error' });
  }
});
```

---

## Common Prisma Commands

```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# Push schema to database (development)
npx prisma db push

# Create migration (production)
npx prisma migrate dev --name add_user_table

# Apply migrations (production)
npx prisma migrate deploy

# Open Prisma Studio (GUI for your database)
npx prisma studio

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Seed database
npx prisma db seed

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

---

## Prisma Studio

Prisma Studio is a visual database browser:

```bash
npx prisma studio
```

Opens at `http://localhost:5555` - you can view and edit your data visually!

---

## Best Practices

### 1. Use Select to Limit Fields

```typescript
// Only fetch needed fields
const users = await fastify.prisma.user.findMany({
  select: {
    id: true,
    email: true,
    name: true,
    // Don't include password or sensitive fields
  },
});
```

### 2. Use Indexes for Performance

```prisma
model User {
  id    String @id @default(uuid())
  email String @unique
  name  String

  @@index([email]) // Add index for faster lookups
}
```

### 3. Handle Null Values

```typescript
// Use ?? for default values
const name = user.name ?? 'Anonymous';

// Or use Prisma's default
model User {
  name String @default("Anonymous")
}
```

### 4. Use Type Safety

```typescript
import { User, Post } from '@prisma/client';

// Type-safe function
async function getUser(id: string): Promise<User | null> {
  return await fastify.prisma.user.findUnique({
    where: { id },
  });
}
```

---

## Example: Complete User API

```typescript
import { FastifyPluginAsync } from 'fastify';
import { Prisma } from '@prisma/client';

const userRoutes: FastifyPluginAsync = async (fastify) => {
  // List users with pagination
  fastify.get('/users', async (request) => {
    const {
      page = 1,
      limit = 10,
      search,
    } = request.query as {
      page?: number;
      limit?: number;
      search?: string;
    };

    const where: Prisma.UserWhereInput = search
      ? {
          OR: [{ email: { contains: search } }, { name: { contains: search } }],
        }
      : {};

    const [users, total] = await Promise.all([
      fastify.prisma.user.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      }),
      fastify.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  });

  // Create user
  fastify.post('/users', async (request, reply) => {
    try {
      const { email, name } = request.body as { email: string; name?: string };

      const user = await fastify.prisma.user.create({
        data: { email, name },
        select: {
          id: true,
          email: true,
          name: true,
          createdAt: true,
        },
      });

      return reply.status(201).send(user);
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          return reply.status(409).send({
            error: 'Email already exists',
          });
        }
      }
      throw error;
    }
  });
};

export default userRoutes;
```

---

## Resources

- **Official Docs**: https://www.prisma.io/docs
- **Prisma Schema Reference**: https://www.prisma.io/docs/reference/api-reference/prisma-schema-reference
- **Prisma Client API**: https://www.prisma.io/docs/reference/api-reference/prisma-client-reference
- **Prisma Examples**: https://github.com/prisma/prisma-examples

---

## Quick Reference Card

| Operation  | Code                                                   |
| ---------- | ------------------------------------------------------ |
| Find all   | `prisma.user.findMany()`                               |
| Find one   | `prisma.user.findUnique({ where: { id } })`            |
| Find first | `prisma.user.findFirst({ where: { email } })`          |
| Create     | `prisma.user.create({ data: { ... } })`                |
| Update     | `prisma.user.update({ where: { id }, data: { ... } })` |
| Delete     | `prisma.user.delete({ where: { id } })`                |
| Count      | `prisma.user.count()`                                  |
| Upsert     | `prisma.user.upsert({ where, create, update })`        |

That's it! Start with the basic CRUD operations and gradually explore more advanced features. 🚀

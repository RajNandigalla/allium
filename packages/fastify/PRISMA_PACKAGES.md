# Prisma Database Support - Package Documentation

## Overview

This document tracks the database packages and versions used in the Allium Fastify integration.

## Current Support Status

### ✅ Supported Databases

- **SQLite** - File-based database (development/testing)
- **MongoDB** - NoSQL document database

### 🔜 Planned Support

- **PostgreSQL** - Production-ready relational database
- **MySQL** - Popular relational database

---

## Package Versions (Latest as of 2025-11-28)

### Core Prisma Packages

| Package          | Version | Purpose           | Maintenance        |
| ---------------- | ------- | ----------------- | ------------------ |
| `@prisma/client` | `7.0.1` | Prisma ORM client | ✅ Official Prisma |
| `prisma`         | `7.0.1` | Prisma CLI (dev)  | ✅ Official Prisma |

### Database Adapters (Prisma v7)

| Package                          | Version | Database            | Maintenance        |
| -------------------------------- | ------- | ------------------- | ------------------ |
| `@prisma/adapter-better-sqlite3` | `7.0.1` | SQLite              | ✅ Official Prisma |
| `@prisma/adapter-pg`             | `7.0.1` | PostgreSQL          | ✅ Official Prisma |
| `@prisma/adapter-planetscale`    | `7.0.1` | MySQL (PlanetScale) | ✅ Official Prisma |

### Database Drivers

| Package          | Version  | Database   | Downloads/week | Maintenance        |
| ---------------- | -------- | ---------- | -------------- | ------------------ |
| `better-sqlite3` | `12.4.6` | SQLite     | 1M+            | ✅ Active          |
| `pg`             | `8.16.3` | PostgreSQL | 8M+            | ✅ PostgreSQL team |
| `mysql2`         | `3.15.3` | MySQL      | 7M+            | ✅ Active          |

### Type Definitions

| Package                 | Version  | Purpose                     |
| ----------------------- | -------- | --------------------------- |
| `@types/better-sqlite3` | `7.6.0`  | SQLite TypeScript types     |
| `@types/pg`             | `8.10.0` | PostgreSQL TypeScript types |

---

## Database-Specific Configuration

### SQLite

```typescript
// Dependencies
"@prisma/adapter-better-sqlite3": "^7.0.1"
"better-sqlite3": "^12.4.6"
"@types/better-sqlite3": "^7.6.0" // devDependencies

// Prisma Schema
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// .env
DATABASE_URL="file:./dev.db"
```

**Pros:**

- No server setup required
- Perfect for development/testing
- Fast for small datasets
- Zero configuration

**Cons:**

- Not suitable for production
- No concurrent writes
- Limited scalability

---

### MongoDB

```typescript
// Dependencies
"@prisma/client": "^7.0.1"
// No adapter needed - native support

// Prisma Schema
datasource db {
  provider = "mongodb"
  url      = env("DATABASE_URL")
}

// .env
DATABASE_URL="mongodb://localhost:27017/mydb"
```

**Pros:**

- Flexible schema
- Horizontal scalability
- Good for unstructured data

**Cons:**

- Limited Prisma features (no joins, transactions)
- Different query syntax
- Requires MongoDB server

---

### PostgreSQL (Planned)

```typescript
// Dependencies
"@prisma/adapter-pg": "^7.0.1"
"pg": "^8.16.3"
"@types/pg": "^8.10.0" // devDependencies

// Prisma Schema
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// .env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
```

**Pros:**

- Full Prisma feature support
- ACID compliance
- Production-ready
- Advanced features (JSON, full-text search)

**Cons:**

- Requires server setup
- More complex than SQLite

---

### MySQL (Planned)

```typescript
// Dependencies
"@prisma/adapter-planetscale": "^7.0.1"
"mysql2": "^3.15.3"

// Prisma Schema
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// .env
DATABASE_URL="mysql://user:password@localhost:3306/mydb"
```

**Pros:**

- Widely used
- Good performance
- Compatible with many hosting providers

**Cons:**

- Requires server setup
- Less advanced features than PostgreSQL

---

## Prisma v7 Adapter Pattern

Prisma v7 uses database adapters for better performance and flexibility:

```typescript
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSQLite } from '@prisma/adapter-better-sqlite3';
import Database from 'better-sqlite3';

const db = new Database('./dev.db');
const adapter = new PrismaBetterSQLite(db);
const prisma = new PrismaClient({ adapter });
```

**Benefits:**

- Better connection pooling
- Improved performance
- More control over database driver
- Support for edge runtimes

---

## Maintenance & Updates

All packages are actively maintained:

- **Prisma packages**: Released together, semantic versioning
- **Database drivers**: Community-maintained, regular updates
- **Type definitions**: DefinitelyTyped community

**Update Strategy:**

- Monitor Prisma releases for breaking changes
- Test adapter compatibility before upgrading
- Keep driver versions in sync with adapter requirements

---

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [Prisma v7 Adapters](https://www.prisma.io/docs/orm/overview/databases/database-drivers)
- [better-sqlite3](https://github.com/WiseLibs/better-sqlite3)
- [node-postgres (pg)](https://node-postgres.com/)
- [mysql2](https://github.com/sidorares/node-mysql2)

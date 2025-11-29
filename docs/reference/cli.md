# Allium CLI Reference

Quick reference for all Allium CLI commands.

## Installation

```bash
npm install -g @allium/cli
# or
yarn global add @allium/cli
```

## Getting Help

Every command has detailed help documentation with examples and usage guidance.

**View all commands:**

```bash
allium --help
```

**Get help for a specific command:**

```bash
allium init --help
allium generate --help
allium sync --help
allium db --help
allium validate --help
allium override --help
```

Each help screen includes:

- Detailed description of what the command does
- Available options with defaults
- Practical examples
- Expected outcomes
- Next steps and workflow guidance

## Commands

### `allium init`

Initialize a new Allium project.

```bash
allium init [options]
```

**Options:**

- `--name <name>` - Project name (default: prompts)
- `--db <database>` - Database type: `postgresql`, `mysql`, `mongodb`, `sqlite` (default: prompts)
- `--path <path>` - Installation path (default: current directory)

**Example:**

```bash
allium init --name my-api --db sqlite
```

**Generated Structure:**

```
my-api/
├── .allium/
│   ├── models/          # JSON model definitions
│   └── prisma/          # Generated Prisma schema
├── src/
│   ├── models/          # Model hooks and logic
│   │   └── user.model.ts
│   └── app.ts           # Application entry point
├── .env                 # Environment variables
├── package.json
├── prisma.config.js     # Prisma configuration
└── tsconfig.json
```

---

### `allium sync`

Generate Prisma schema and optionally scaffold modules from model definitions.

```bash
allium sync [options]
```

**Options:**

- `--scaffold` - Generate module scaffolding in `src/modules`

**What it does:**

1. Validates all models in `.allium/models/*.json`
2. Generates aggregated schema at `.allium/schema.json`
3. Generates Prisma schema at `.allium/prisma/schema.prisma`
4. (Optional) Generates controllers, services, routes

**Example:**

```bash
# Just sync schema
allium sync

# Sync and generate modules
allium sync --scaffold
```

---

### `allium generate`

Generate resources like models, overrides, controllers, or routes.

```bash
allium generate [type] [options]
# or use alias
allium g [type]
```

**Types:**

- `model` - Generate a new model with fields and relations
- `override` - Create an override file for customizing generated code
- `controller` - Generate a custom controller
- `route` - Generate a custom route

**Options:**

- `--definition <json>` - JSON definition of the model (for non-interactive mode)
- `-m, --model <name>` - Model name (required for overrides)
- `-l, --layer <layer>` - Layer to override: service, controller, routes

**Examples:**

```bash
# Interactive mode
allium generate

# Generate model interactively
allium generate model

# Quick model with fields
allium generate model
# Then enter: name:String price:Float stock:Int

# Generate from JSON
allium generate model --definition '{"name":"Product","fields":[...]}'

# Create override
allium generate override --model User --layer service
```

---

### `allium override`

Create an override file to customize generated code for a specific model layer.

```bash
allium override <model> <layer>
```

**Available Layers:**

- `service` - Override database operations
- `controller` - Override request handlers
- `routes` - Override route definitions

**Examples:**

```bash
# Override User service
allium override User service

# Override Post controller
allium override Post controller

# Override Product routes
allium override Product routes
```

**What it creates:**

```
src/modules/{model}/overrides/{model}.{layer}.ts
```

**Use Cases:**

- Add custom business logic
- Modify default CRUD operations
- Add custom validation
- Integrate third-party services

---

### `allium validate`

Validate all model definitions.

```bash
allium validate
```

**What it checks:**

- JSON syntax
- Required fields
- Field types
- Relation integrity
- Naming conventions

---

### `allium db`

Database management commands (wraps Prisma CLI).

```bash
allium db <command>
```

**Subcommands:**

- `generate` - Generate Prisma Client
- `push` - Push schema to database (dev)
- `migrate` - Create and run migrations (production)
- `studio` - Open Prisma Studio

**Examples:**

```bash
# Generate Prisma Client
allium db generate

# Push schema to dev database
allium db push

# Create migration
allium db migrate dev --name add_user_table

# Open database GUI
allium db studio
```

---

## Typical Workflow

### 1. Create New Project

```bash
allium init --name my-api --db sqlite
cd my-api
npm install
```

### 2. Define Models

Edit `.allium/models/user.json`:

```json
{
  "name": "User",
  "fields": [
    { "name": "email", "type": "String", "unique": true },
    { "name": "name", "type": "String", "required": false }
  ]
}
```

### 3. Sync Schema

```bash
allium sync
```

### 4. Push to Database

```bash
allium db generate
allium db push
```

### 5. Run Development Server

```bash
npm run dev
```

### 6. Access API

- API: `http://localhost:3000/api`
- Swagger Docs: `http://localhost:3000/documentation`

---

## Generated API Routes

For each model (e.g., `User`), the following REST endpoints are automatically created:

| Method   | Endpoint        | Description                |
| -------- | --------------- | -------------------------- |
| `POST`   | `/api/user`     | Create new user            |
| `GET`    | `/api/user`     | List all users (paginated) |
| `GET`    | `/api/user/:id` | Get user by ID             |
| `PATCH`  | `/api/user/:id` | Update user                |
| `DELETE` | `/api/user/:id` | Delete user                |

### Query Parameters (List Endpoint)

**`GET /api/user`** supports:

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10, max: 100)
- `sort` - Sort field:order (e.g., `createdAt:desc`)
- `filter` - JSON filter conditions

**Examples:**

```bash
# Get page 2 with 20 items
GET /api/user?page=2&limit=20

# Sort by creation date (newest first)
GET /api/user?sort=createdAt:desc

# Filter by field
GET /api/user?filter={"name":"John"}
```

---

## Model Hooks

Add custom logic in `src/models/*.model.ts`:

```typescript
import { registerModel } from '@allium/core';

export const User = registerModel('User', {
  beforeCreate: async (data, context) => {
    // Hash password, validate, etc.
    return data;
  },

  afterCreate: async (record, context) => {
    // Send welcome email, log, etc.
  },

  beforeUpdate: async (id, data, context) => {
    return data;
  },

  afterUpdate: async (record, previousData, context) => {
    // Audit log, notifications, etc.
  },

  beforeDelete: async (id, context) => {
    // Check permissions, cascade, etc.
  },

  afterDelete: async (id, deletedData, context) => {
    // Cleanup, notifications, etc.
  },
});
```

---

## Environment Variables

**`.env`** file:

```bash
# Database
DATABASE_URL="file:./dev.db"  # SQLite
# DATABASE_URL="postgresql://user:pass@localhost:5432/mydb"  # PostgreSQL
# DATABASE_URL="mysql://user:pass@localhost:3306/mydb"  # MySQL

# Server
PORT=3000
NODE_ENV=development
```

---

## Troubleshooting

### Models not loading

1. Run `allium validate` to check for errors
2. Run `allium sync` to regenerate schema
3. Ensure `.allium/schema.json` exists
4. Check that model files end with `.model.ts`

### Database connection issues

1. Check `DATABASE_URL` in `.env`
2. Verify database is running
3. Run `allium db push` to sync schema

### Type errors

1. Run `allium db generate` to regenerate Prisma Client
2. Restart TypeScript server in your IDE

---

## Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Fastify Documentation](https://fastify.dev)
- [Model Schema Reference](./packages/core/src/schemas/model.schema.json)

# Allium

> CLI scaffolding tool for creating production-ready APIs with Fastify, Prisma, TypeScript, and GraphQL.

## 🏗️ Monorepo Structure

This project uses **Nx** for monorepo management:

```
allium/
├── packages/
│   ├── cli/        # CLI tool (@allium/cli)
│   └── core/       # Shared core logic (@allium/core)
├── nx.json
├── package.json
└── tsconfig.base.json
```

## 📦 Packages

### `@allium/cli`

The command-line interface for Allium.

**Commands:**

- `allium init` - Initialize a new project with best-practice structure.
- `allium generate [type]` - Generate resources:
  - `model` (default) - Create model definitions with **Quick Mode** (e.g., `name:String email:String:unique`).
  - `override` - Create overrides with **auto-suggestions** for available models.
  - `controller` - Scaffold a generic controller.
  - `route` - Scaffold a generic route.
- `allium validate` - Validate model definitions.
- `allium sync` - Generate code from models (Prisma, Fastify, Zod, Swagger).

### `@allium/core`

Shared core functionality used by the CLI and future UI.

**Exports:**

- Model types and interfaces
- JSON schema validator
- Prisma schema generator
- Module code generator (REST, GraphQL, Services)

## ✨ Key Features

- **🚀 Production-Ready Stack**: Fastify, Prisma, TypeScript, Zod.
- **📄 Auto-Swagger**: Generated APIs come with fully wired OpenAPI/Swagger documentation.
- **⚡ Quick Generation**: Define models rapidly with shorthand syntax.
- **🛡️ Type-Safe**: End-to-end type safety from database to API response.
- **🆔 UUID-Based IDs**: All models automatically include `id` (uuid primary key), `uuid`, `createdAt`, and `updatedAt` fields.
- **🗑️ Soft Deletes**: Built-in support for soft deletion with restore capabilities.
- **📝 Audit Trails**: Automatic tracking of `createdBy`, `updatedBy`, and `deletedBy`.
- **✅ Field Validation**: Declarative validation rules (min, max, pattern, enum) enforced at runtime.
- **🔢 Enum Support**: First-class support for enum fields with automatic Prisma mapping.
- **🔒 Field Visibility**: Mark fields as `private` to auto-exclude from API responses (e.g., passwords).
- **🔍 Advanced Filtering**: Strapi-style filtering with operators (`$eq`, `$gt`, `$contains`, etc.).
- **📊 Multi-Field Sorting**: Sort by multiple fields with array syntax.
- **🧮 Computed/Virtual Fields**: Define calculated fields (template or function-based) that appear in responses but aren't stored.
- **🔐 Compound Unique Constraints**: Enforce uniqueness across multiple fields (e.g., `[userId, postId]`).
- **🎭 Masked Fields**: Automatically mask sensitive data (credit cards, SSNs) in API responses.
- **📦 JSON Field Support**: Schema validation and nested filtering for JSON fields.

## 🚀 Development

### Install Dependencies

```bash
npm install
```

### Build All Packages

```bash
npm run build
```

### Build Specific Package

```bash
npm run build:core
npm run build:cli
```

### Run CLI in Development

```bash
npm run dev -- init --name test-project --db sqlite
```

### Clean Build Artifacts

```bash
npm run clean
```

## 🧪 Testing the CLI

After building, test the CLI:

```bash
# Test help
node packages/cli/dist/index.js --help

# Test init
node packages/cli/dist/index.js init --name my-api --db postgresql

# Test generate
cd my-api
node ../packages/cli/dist/index.js generate --definition '{
  "name": "Product",
  "fields": [{"name": "title", "type": "String", "required": true}]
}'

# Test validate & sync
node ../packages/cli/dist/index.js validate
node ../packages/cli/dist/index.js sync
```

## 📖 Documentation

### Quick Reference

**CLI Commands:**

```bash
allium init          # Create new project
allium sync          # Generate schema from models
allium validate      # Validate model definitions
allium db generate   # Generate Prisma Client
allium db push       # Push schema to database
allium db studio     # Open database GUI
```

**Generated API Routes** (for each model):

- `POST /api/{model}` - Create
- `GET /api/{model}` - List (with pagination, sorting, filtering)
- `GET /api/{model}/:id` - Get by ID
- `PATCH /api/{model}/:id` - Update
- `DELETE /api/{model}/:id` - Delete (or Soft Delete if enabled)
- `POST /api/{model}/:id/restore` - Restore (if soft delete enabled)
- `DELETE /api/{model}/:id/force` - Force Delete (if soft delete enabled)

### Full Documentation

### Full Documentation

- **[CLI Reference](./docs/reference/cli.md)** - Complete command reference
- **[API Routes](./docs/reference/api-routes.md)** - Generated API endpoints reference
- **[Roadmap](./docs/ROADMAP.md)** - Future plans and features
- **[Fastify Package README](./packages/fastify/README.md)** - Fastify integration details

### Guides

- [Basic Example](./docs/guides/basic-example.md) - Simple product model example
- [Plugin Configuration](./docs/guides/plugin-configuration.md) - Configuring plugins
- [Hidden Generation](./docs/reference/hidden-generation.md) - Understanding the generation architecture
- [Auto-Load Models](./docs/guides/auto-load-models.md) - Using fastify-autoload with models

## 🛠️ Tech Stack

- **Nx** - Monorepo management
- **TypeScript** - Type-safe development
- **Commander** - CLI framework
- **Inquirer** - Interactive prompts
- **Ajv** - JSON schema validation
- **Prisma** - ORM for generated projects

## 🤝 Contributing

This is a monorepo. When adding features:

1. **Shared logic** → `packages/core`
2. **CLI commands** → `packages/cli`
3. **Future UI** → `packages/ui` (coming soon)

## 📝 License

ISC

---

**Built with ❤️ using Nx**

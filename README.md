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

- [Walkthrough](/.gemini/antigravity/brain/1d321bdf-9ebf-443b-88a4-69a31bbb78d6/walkthrough.md) - Complete feature walkthrough
- [Roadmap](/ROADMAP.md) - Future plans and features

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

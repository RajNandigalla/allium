# Technical Debt & Improvements

## 🚨 High Priority

### Type Safety

- [ ] **Remove `any` casts**:
  - `packages/fastify/src/generators/crud-routes.ts`: `operation as any` cast in `isOperationEnabled`.
  - `packages/fastify/src/server.ts`: `models as any` cast in `syncDatabase`.
  - `packages/fastify/src/server.ts`: `plugin as any` cast in `initAllium`.
- [ ] **Strict Null Checks**: Ensure strict null checks are enabled and resolved across all packages.

### Error Handling

- [ ] **Centralized Error Handler**: Replace try/catch blocks in `crud-routes.ts` with a global Fastify error handler.
- [ ] **Standardized Error Responses**: Ensure all errors return a consistent JSON structure (e.g., `{ error: { code, message, details } }`).

## 🛠️ Refactoring

### Code Structure

- [ ] **Split `crud-routes.ts`**: This file is getting large. Extract route handlers (create, read, etc.) into separate files.
- [ ] **Plugin Architecture**: Refactor `initAllium` to be more modular, potentially moving Prisma sync logic to a dedicated plugin.

### Validation

- [ ] **Zod Integration**: Consider replacing manual schema generation with `zod-to-json-schema` for more robust validation.

## 🧪 Testing

- [ ] **Unit Tests**: Add unit tests for `crud-routes.ts` logic (especially the new `isOperationEnabled` and prefix logic).
- [ ] **Integration Tests**: Create a test suite that spins up a real Fastify instance and tests the generated APIs against an in-memory DB (SQLite).
- [ ] **E2E Tests**: Test the CLI `init` command to ensure generated projects build and run correctly.

## 🚀 Performance

- [ ] **Caching**: Implement caching strategies for `GET` requests (e.g., `fastify-redis`).
- [ ] **Query Optimization**: Review generated Prisma queries for potential N+1 issues (though `include` helps).

## 🔒 Security

- [ ] **Rate Limiting**: Implement `fastify-rate-limit` (currently on Roadmap).
- [ ] **Input Sanitization**: Ensure all inputs are properly sanitized beyond just type checking.

## 📦 CLI

- [ ] **Templates**: Move hardcoded file templates (in `init.ts`) to separate template files or a proper scaffolding engine (e.g., `plop` or `hygen`).
- [ ] **Validation**: Add validation for project names and database options.

## 🧠 Core

- [ ] **Schema Generation**: Refactor `schema-generator.ts` to use an AST or builder pattern instead of string concatenation for safer Prisma schema generation.
- [ ] **Model Validation**: Add runtime validation for model definitions (e.g., ensuring `fields` array exists and has valid types).

## 🏭 Production Readiness

- [ ] **Migrations**: Support `prisma migrate` workflows instead of just `db push` for production database changes.
- [ ] **Env Validation**: Validate required environment variables (like `DATABASE_URL`) on startup using a library like `envalid`.
- [ ] **Graceful Shutdown**: Ensure database connections and server close gracefully on `SIGTERM`.

## 👁️ Observability

- [ ] **Structured Logging**: Configure Pino for better structured logging in production.
- [ ] **Log Redaction**: Ensure sensitive fields (passwords, tokens) are redacted from logs (Masked Fields feature handles API responses, but not logs).
- [ ] **Metrics**: Expose Prometheus metrics for monitoring.

## 🔌 Plugin Ecosystem

- [ ] **Expose Models**: Decorate `fastify.models` so plugins can access the model registry.
- [ ] **Plugin Standards**: Define a standard interface for Allium plugins (beyond just Fastify plugins).

## 🗄️ Database Support

- [ ] **PostgreSQL/MySQL Support**: The `prisma.ts` plugin currently has hardcoded support for SQLite and MongoDB. We need to add proper factories for PostgreSQL and MySQL.
- [ ] **Connection Pooling**: Configure connection pooling for SQL databases.

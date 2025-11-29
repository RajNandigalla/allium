# Allium Roadmap

## ✅ Completed (v0.1.0)

### Core Features

- [x] Project initialization (`allium init`)
- [x] JSON-first model definitions
- [x] Model validation (`allium validate`)
- [x] Code generation (`allium sync`)
- [x] Prisma schema generation
- [x] REST API generation (CRUD)
- [x] GraphQL resolver generation
- [x] Service layer generation
- [x] Zod schema validation
- [x] Support for multiple databases (PostgreSQL, MySQL, MongoDB, SQLite)
- [x] Basic relationships (1:1, 1:n, n:m)

---

## 🚧 In Progress (v0.2.0)

### Developer Experience

- [ ] Auto-register routes in `app.ts`
- [ ] README generation for generated projects
- [x] Better error messages and validation feedback
- [ ] CLI help documentation improvements

### Code Quality

- [ ] Unit tests for CLI
- [ ] Integration tests for generated code
- [ ] CI/CD pipeline

---

## 📋 Planned Features

### Phase 1: Enhanced Model Definitions (v0.3.0)

**Field-Level Features**

- [x] Default values for fields
- [x] Field validation rules (regex, min/max, custom)
- [x] Compound unique constraints
- [x] Computed/virtual fields
- [x] Enum support
- [x] Field Visibility Control (Private/Hidden fields e.g., password)
- [x] Encrypted Fields (At-rest encryption for sensitive data)
- [x] Masked Fields (Partial display e.g., `****-1234`)
- [x] JSON Field Support (Schema validation & nested filtering)

**Compound Features**

- [x] Compound Unique Constraints (e.g., unique `[userId, postId]`)
- [ ] Compound Required / Conditional Validation (e.g., "At least one of X or Y")
- [x] Compound Indexes (Performance optimization)
- [ ] Compound Primary Keys
- [ ] Compound Foreign Keys

**Relationship Enhancements**

- [x] Relationship Cascade Options (Cascade, SetNull, Restrict)
- [ ] Custom foreign key names
- [ ] Self-referencing relationships
- [ ] Polymorphic relationships

**Model Configuration**

```json
{
  "name": "User",
  "fields": [
    {
      "name": "email",
      "type": "String",
      "unique": true,
      "validation": {
        "pattern": "^[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$"
      }
    },
    {
      "name": "age",
      "type": "Int",
      "validation": {
        "min": 18,
        "max": 120
      }
    },
    {
      "name": "status",
      "type": "Enum",
      "values": ["active", "inactive", "banned"],
      "default": "active"
    }
  ]
}
```

---

### Phase 2: API Customization (v0.4.0)

**Route Configuration**

- [x] Custom route prefixes per model
- [x] Enable/disable specific operations (create, read, update, delete)
- [ ] Custom endpoint paths
- [x] Rate limiting configuration
- [ ] API Versioning support (e.g., v1, v2)

**Plugin System**

- [x] Custom Plugin API (via `initAllium` plugins option)
- [ ] Plugin Lifecycle Hooks
- [ ] Third-party Plugin Registry support

**Authentication & Authorization**

- [ ] JWT authentication setup
- [ ] Role-based access control (RBAC)
- [ ] SSO & Social Auth (Google, GitHub, Auth0)
- [ ] Permission decorators
- [ ] Protected routes configuration
- [ ] Field-Level Permissions (read/update per role)

```json
{
  "name": "Product",
  "api": {
    "prefix": "/api/v1/products",
    "operations": ["create", "read", "update"],
    "auth": {
      "required": true,
      "roles": ["admin", "editor"]
    }
  }
}
```

---

### Phase 3: Advanced Features (v0.5.0)

**Search & Filtering**

- [ ] Basic search support (Prisma full-text)
- [ ] Advanced filtering DSL
- [ ] Search engine integration (Elasticsearch, Typesense, Meilisearch)
- [ ] Faceted search support

**Pagination & Sorting**

- [ ] Cursor-based pagination
- [ ] Offset-based pagination
- [ ] Multi-field sorting
- [ ] Configurable default page sizes

**Soft Deletes**

- [x] `deletedAt` field support
- [x] Automatic filtering of deleted records
- [x] Restore functionality

**Audit Logging**

- [x] Track who created/updated records
- [x] Automatic `createdBy`/`updatedBy` fields
- [ ] Change history tracking
- [ ] Change history tracking
- [ ] Internationalization (i18n) support
- [ ] Feature Flags & A/B Testing

**Content Workflows**

- [ ] Draft & Publish Workflow (status management, scheduling)

---

### Phase 4: Developer Tools (v0.6.0)

**VSCode Extension**

- [ ] IntelliSense for model JSON files
- [ ] Auto-complete for field types
- [ ] Relationship validation in editor
- [ ] Model visualization

**CLI Enhancements**

- [ ] Interactive model builder (TUI)
- [ ] Model diff viewer
- [ ] Migration preview
- [ ] Rollback support
- [ ] Interactive Console (REPL)

**Documentation Generation**

- [ ] Auto-generate API documentation
- [ ] Swagger/OpenAPI spec generation
- [ ] GraphQL schema documentation
- [ ] Postman collection export

---

### Phase 5: Testing & Quality (v0.7.0)

**Test Generation**

- [ ] Unit test scaffolding for services
- [ ] Integration test templates
- [ ] E2E test examples
- [ ] Mock data generation

**Code Quality**

- [ ] ESLint configuration
- [ ] Prettier setup
- [ ] Husky pre-commit hooks
- [ ] TypeScript strict mode
- [ ] Data Seeding & Fixtures (faker.js integration)

---

### Phase 6: Deployment & DevOps (v0.8.0)

**Containerization**

- [ ] Docker setup generation
- [ ] Docker Compose for local development
- [ ] Kubernetes manifests (optional)
- [ ] Serverless Deployment Adapters (AWS Lambda, Vercel, Cloudflare)

**CI/CD**

- [ ] GitHub Actions workflows
- [ ] GitLab CI templates
- [ ] Environment variable management

**Monitoring**

- [ ] Health check endpoints
- [ ] Prometheus metrics
- [ ] OpenTelemetry Integration (Tracing)
- [ ] Logging configuration (Winston/Pino)

---

### Phase 7: UI & Admin Panel (v1.0.0)

**Web UI for Model Management**

- [ ] Visual model designer
- [ ] Drag-and-drop relationship builder
- [ ] Live preview of generated code
- [ ] Model import/export

**Admin Panel Generation**

- [ ] Auto-generated CRUD admin UI
- [ ] Dashboard with analytics (API usage, latency, errors)
- [ ] User management interface
- [ ] File upload support

---

## 🔮 Future Considerations

### Multi-Language Support

- [ ] Kotlin/Spring Boot backend generation
- [ ] Python/FastAPI backend generation
- [ ] Go/Gin backend generation
- [ ] Edge Runtime Support (Cloudflare Workers, Vercel Edge)

### Advanced Integrations

- [ ] Redis caching layer
- [ ] Message queue support (RabbitMQ, Kafka)
- [ ] WebSocket support
- [ ] File storage (S3, local)
- [ ] Email service integration
- [ ] Payment gateway integration (Stripe, PayPal)
- [ ] Outgoing Webhooks (Event subscriptions)
- [ ] Cron Jobs / Scheduled Tasks

### Performance

- [ ] Query optimization suggestions
- [ ] N+1 query detection
- [ ] Database connection pooling
- [ ] Caching strategies

### Security

- [ ] SQL injection prevention
- [ ] XSS protection
- [ ] CSRF tokens
- [ ] Security headers configuration
- [ ] Encryption at rest

---

## 📊 Version Timeline

| Version | Target Date | Focus                         |
| ------- | ----------- | ----------------------------- |
| v0.1.0  | ✅ Done     | Core scaffolding & JSON-first |
| v0.2.0  | Q1 2025     | DX improvements               |
| v0.3.0  | Q1 2025     | Enhanced models               |
| v0.4.0  | Q2 2025     | API customization             |
| v0.5.0  | Q2 2025     | Advanced features             |
| v0.6.0  | Q3 2025     | Developer tools               |
| v0.7.0  | Q3 2025     | Testing & quality             |
| v0.8.0  | Q4 2025     | Deployment                    |
| v1.0.0  | Q4 2025     | UI & admin panel              |

---

## 🤝 Contributing

Want to help build Allium? Check out our [Contributing Guide](CONTRIBUTING.md) (coming soon).

**Priority Areas:**

1. Auto-registration of routes
2. Enhanced validation
3. Authentication/authorization
4. Search integration
5. VSCode extension

---

## 📝 Notes

- This roadmap is subject to change based on community feedback
- Features may be added, removed, or reprioritized
- Version numbers are tentative

**Last Updated:** 2025-11-26

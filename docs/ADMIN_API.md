# Admin API Guide

The Allium Admin API provides a comprehensive set of endpoints to manage your project's schema, data, and configuration programmatically. It serves as the backend for the Allium Admin UI and can be used for automation or building custom tools.

## Enabling the Admin API

The Admin API is enabled by default in **development mode** (`NODE_ENV=development`).

To explicitly enable or disable it, configure the `adminApi` option in your `initAllium` call (if exposed) or via environment variables.

**Base URL:** `/_admin`

## Authentication

Currently, the Admin API is restricted to **development environments** and does not require authentication headers by default. In production, this API is disabled for security.

## Endpoint Groups

The API is organized into the following logical groups:

### 1. Configuration & Metadata (`Admin - Config`)

Endpoints for retrieving project configuration and available schema options.

- `GET /_admin/config`: Project name, version, and root path.
- `GET /_admin/types`: Supported data types (String, Int, Boolean, etc.).
- `GET /_admin/relationships`: Supported relationship types (1:1, 1:n, n:m).
- `GET /_admin/field-options`: Available options for fields (required, unique, etc.).
- `GET /_admin/validation-rules`: Available validation rules.

### 2. Model Management (`Admin - Models`)

CRUD operations for defining data models.

- `GET /_admin/models`: List all models.
- `GET /_admin/models/:name`: Get details of a specific model.
- `POST /_admin/models`: Create a new model.
- `PUT /_admin/models/:name`: Update a model definition.
- `DELETE /_admin/models/:name`: Delete a model.

### 3. Field Management (`Admin - Fields`)

Manage fields within a model.

- `POST /_admin/models/:name/fields`: Add a new field.
- `PUT /_admin/models/:name/fields/:fieldName`: Update an existing field.
- `DELETE /_admin/models/:name/fields/:fieldName`: Remove a field.

### 4. Relationship Management (`Admin - Relations`)

Manage relationships between models.

- `POST /_admin/models/:name/relations`: Add a relationship.
- `PUT /_admin/models/:name/relations/:relationName`: Update a relationship.
- `DELETE /_admin/models/:name/relations/:relationName`: Remove a relationship.

### 5. Schema Operations (`Admin - Schema`)

Operations to synchronize the JSON model definitions with the Prisma schema and database.

- `POST /_admin/sync`: Trigger `allium sync` to generate Prisma schema and client.
- `GET /_admin/schema`: View the generated `schema.prisma` content.
- `GET /_admin/schema/status`: Check if the schema is in sync.

### 6. API Key Management (`Admin - API Keys`)

Manage API keys for service-to-service authentication.

- `GET /_admin/api-keys`: List all API keys (showing secrets).
- `POST /_admin/api-keys`: Generate a new API key.
- `DELETE /_admin/api-keys/:id`: Revoke (delete) an API key.

### 7. Database Operations (`Admin - Database`)

Development tools for database management.

- `POST /_admin/db/seed`: Run the database seed script (`npx prisma db seed`).
- `POST /_admin/db/reset`: Reset the database (`npx prisma migrate reset --force`). **Destructive!**
- `GET /_admin/db/stats`: Get record counts for all models.

### 8. Data Explorer (`Admin - Data Explorer`)

"God Mode" generic CRUD endpoints to view and manage data in any model, bypassing public API restrictions.

- `GET /_admin/data/:model`: List records with pagination, sorting, and filtering.
  - Query Params: `page`, `limit`, `sort`, `order`, `q` (search).
- `GET /_admin/data/:model/:id`: Get a single record.
- `POST /_admin/data/:model`: Create a record.
- `PUT /_admin/data/:model/:id`: Update a record.
- `DELETE /_admin/data/:model/:id`: Delete a record.

### 9. System Information (`Admin - System`)

- `GET /_admin/system/info`: View server OS and Node.js memory/uptime statistics.

## Common Workflows

### Creating a New Model

1.  **Create Model:** `POST /_admin/models` with `{ name: "Post", fields: [...] }`.
2.  **Sync Schema:** `POST /_admin/sync` to generate the Prisma schema and client.
3.  **Verify:** `GET /_admin/schema/status` should return `inSync: true`.

### Seeding Data

1.  **Reset DB (Optional):** `POST /_admin/db/reset` to clear all data.
2.  **Run Seed:** `POST /_admin/db/seed` to populate initial data.
3.  **Check Stats:** `GET /_admin/db/stats` to verify record counts.

### Inspecting Data

1.  **List Records:** `GET /_admin/data/User?page=1&limit=20&sort=createdAt&order=desc`.
2.  **View Details:** `GET /_admin/data/User/123`.

## API Documentation

The Admin API documentation is available via Swagger UI at `/documentation`.

- **Public API:** The default view shows only user-facing endpoints.
- **Admin API:** Select "Admin API" from the dropdown in the top bar to view all Admin endpoints.

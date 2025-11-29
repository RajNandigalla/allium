# API Routes Reference

This document describes the automatically generated REST API endpoints for each model.

## Route Structure

For each model defined in `.allium/models/*.json`, Allium automatically generates a complete REST API with the following endpoints:

### Base Path

All routes are prefixed with `/api` by default. For a model named `User`, routes are available at `/api/user`.

---

## Endpoints

### 1. Create Record

**`POST /api/{model}`**

Create a new record.

**Request Body:**

```json
{
  "field1": "value1",
  "field2": "value2"
}
```

**Response:** `201 Created`

```json
{
  "id": "uuid",
  "uuid": "uuid",
  "field1": "value1",
  "field2": "value2",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

---

### 2. List Records

**`GET /api/{model}`**

List all records with pagination, sorting, and filtering.

**Query Parameters:**

- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 10, max: 100)
- `sort` (string) - Sort field:order (e.g., `createdAt:desc`, `name:asc`)
- `filter` (string) - JSON filter conditions

**Examples:**

```bash
# Get first page
GET /api/user

# Get page 2 with 20 items
GET /api/user?page=2&limit=20

# Sort by creation date (newest first)
GET /api/user?sort=createdAt:desc

# Filter by field
GET /api/user?filter={"name":"John"}

# Combine parameters
GET /api/user?page=1&limit=10&sort=createdAt:desc&filter={"active":true}
```

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "uuid",
      "uuid": "uuid",
      "field1": "value1",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 42
  }
}
```

---

### 3. Get Record by ID

**`GET /api/{model}/:id`**

Retrieve a single record by its ID.

**Parameters:**

- `id` (string) - Record UUID

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "uuid": "uuid",
  "field1": "value1",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Error:** `404 Not Found`

```json
{
  "error": "User not found"
}
```

---

### 4. Update Record

**`PATCH /api/{model}/:id`**

Update an existing record.

**Parameters:**

- `id` (string) - Record UUID

**Request Body:**

```json
{
  "field1": "new value"
}
```

**Response:** `200 OK`

```json
{
  "id": "uuid",
  "uuid": "uuid",
  "field1": "new value",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:01.000Z"
}
```

---

### 5. Delete Record

**`DELETE /api/{model}/:id`**

Delete a record.

**Parameters:**

- `id` (string) - Record UUID

**Response:** `200 OK`

```json
{
  "message": "User deleted successfully"
}
```

**Error:** `404 Not Found`

```json
{
  "error": "User not found"
}
```

---

## Swagger/OpenAPI Documentation

All generated routes are automatically documented and available via Swagger UI.

**Access Swagger:**

```
http://localhost:3000/documentation
```

The Swagger UI provides:

- Interactive API testing
- Request/response schemas
- Example values
- Authentication requirements (if configured)

---

## Lifecycle Hooks

You can add custom logic to any CRUD operation by defining hooks in `src/models/*.model.ts`:

```typescript
import { registerModel } from '@allium/core';

export const User = registerModel('User', {
  beforeCreate: async (data, context) => {
    // Modify data before creation
    data.email = data.email.toLowerCase();
    return data;
  },

  afterCreate: async (record, context) => {
    // Execute after creation
    console.log('User created:', record.id);
  },

  beforeUpdate: async (id, data, context) => {
    // Validate or modify update data
    return data;
  },

  afterUpdate: async (record, previousData, context) => {
    // Log changes, send notifications, etc.
  },

  beforeDelete: async (id, context) => {
    // Check permissions, prevent deletion, etc.
  },

  afterDelete: async (id, deletedData, context) => {
    // Cleanup related data, send notifications, etc.
  },
});
```

**Hook Context:**

Each hook receives a `context` object with:

- `prisma` - Prisma Client instance
- `user` - Authenticated user (if auth is configured)
- `request` - Fastify request object
- `services` - Custom services
- `logger` - Logger instance

---

## Customizing Routes

### Disable Specific Operations

In your model JSON definition:

```json
{
  "name": "User",
  "fields": [...],
  "api": {
    "operations": ["create", "read"]  // Only allow create and read
  }
}
```

Available operations: `create`, `read`, `update`, `delete`

### Custom Route Prefix

In `src/app.ts`:

```typescript
const app = await initAllium({
  models,
  routePrefix: '/v1',  // Routes will be at /v1/user instead of /api/user
  prisma: { ... }
});
```

---

## Error Responses

All endpoints follow a consistent error format:

**Validation Error:** `400 Bad Request`

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

**Not Found:** `404 Not Found`

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "User not found"
}
```

**Server Error:** `500 Internal Server Error`

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

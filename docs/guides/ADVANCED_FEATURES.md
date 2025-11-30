# Allium Advanced Features Guide

This guide documents the advanced features and recent enhancements in the Allium framework, including relation management, API population, and standardized error handling.

## 1. Bidirectional Relations

Allium now automatically handles bidirectional relationships in Prisma schema generation.

### How it Works

When you define a relation in one model, `allium sync` automatically infers and generates the opposite relation field in the target model.

**Example:**
If you define a `1:n` relation in `User`:

```json
// user.json
{
  "name": "User",
  "relations": [
    {
      "name": "facility",
      "type": "1:n",
      "model": "Facility"
    }
  ]
}
```

Allium will automatically generate:

- `facility Facility?` in the `User` Prisma model.
- `users User[]` in the `Facility` Prisma model.

### Optional Relations

You can make a relation optional (nullable foreign key) by setting `"required": false`.

```json
{
  "name": "facility",
  "type": "1:n",
  "model": "Facility",
  "required": false
}
```

This is useful for migrating existing data where the foreign key might be missing.

---

## 2. API Population (Fetching Related Data)

You can fetch related records in a single request using the `populate` query parameter.

### Usage

Add `?populate=relationName` to your GET requests.

**Get Single Record with Relation:**

```http
GET /api/user/{id}?populate=facility
```

**List Records with Relation:**

```http
GET /api/user?populate=facility
```

**Multiple Relations:**
Separate multiple relations with a comma:

```http
GET /api/user?populate=facility,posts
```

### Response Format

The related object will be included in the response JSON:

```json
{
  "id": "...",
  "name": "John Doe",
  "facilityId": "...",
  "facility": {
    "id": "...",
    "name": "Main Office",
    "address": "..."
  }
}
```

---

## 3. Standardized Error Handling

Allium APIs use a consistent, standardized error format for all responses, including validation and database errors.

### Error Format

```json
{
  "statusCode": 400,
  "error": "Bad Request", // or Conflict, Not Found, etc.
  "message": "Human-readable error summary",
  "errors": [
    // Optional: Detailed field-level errors
    {
      "field": "fieldName",
      "message": "Specific error message"
    }
  ]
}
```

### Common Error Types

#### Validation Error (400)

Occurs when input data fails validation rules.

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "errors": [
    {
      "field": "role",
      "message": "Value must be one of: user, admin, moderator"
    }
  ]
}
```

#### Foreign Key Constraint (400/409)

Occurs when referencing a non-existent record (Create/Update) or deleting a record with dependents.

**Create/Update (400):**

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Foreign key constraint violation",
  "errors": [
    {
      "field": "facilityId",
      "message": "Invalid reference: Value does not exist"
    }
  ]
}
```

**Delete (409):**

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Foreign key constraint violation",
  "errors": [
    {
      "field": "id",
      "message": "Cannot delete record because it has related records. Delete or update the related records first."
    }
  ]
}
```

#### Unique Constraint (409)

Occurs when trying to create a duplicate record for a unique field (e.g., email).

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Unique constraint failed on field: email",
  "errors": [
    {
      "field": "email",
      "message": "A record with this email already exists"
    }
  ]
}
```

**Multiple Fields:**

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Unique constraint failed on fields: email, username",
  "errors": [
    {
      "field": "email",
      "message": "A record with this email already exists"
    },
    {
      "field": "username",
      "message": "A record with this username already exists"
    }
  ]
}
```

#### Invalid Data Format (400)

Occurs when data is in an invalid format (e.g., invalid date string, wrong type).

```json
{
  "statusCode": 400,
  "error": "Bad Request",
  "message": "Invalid data format for field: expiresAt",
  "errors": [
    {
      "field": "expiresAt",
      "message": "Invalid date format. Expected ISO 8601 format (e.g., \"2024-12-31T23:59:59Z\")"
    }
  ]
}
```

#### Not Found (404)

Occurs when the requested resource does not exist.

```json
{
  "statusCode": 404,
  "error": "Not Found",
  "message": "User not found"
}
```

#### Internal Server Error (500)

For unexpected errors, Allium returns contextual error messages:

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "Failed to create record",
  "details": "..." // Only in development mode (NODE_ENV=development)
}
```

---

## 4. Built-in API Key Authentication

Allium includes built-in API key authentication for secure service-to-service communication.

### **Enable Authentication**

1. Enable `apiKeyAuth` in configuration:

```typescript
import { initAllium } from '@allium/fastify';
import { User, Product } from './models';

const app = await initAllium({
  models: [User, Product],

  apiKeyAuth: {
    enabled: true,
  },

  prisma: {
    datasourceUrl: 'file:./dev.db',
    provider: 'sqlite',
  },
});
```

### **What Happens**

When configured, Allium:

1. Generates the Prisma schema for ApiKey (via `allium sync`)
2. Protects all routes (except `/documentation` and `/health`)
3. Validates API keys from the `X-API-Key` header

### **Creating API Keys**

Create an API key via the auto-generated endpoint:

```bash
curl -X POST http://localhost:3000/api/apikey \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Payment Service",
    "service": "payment-service"
  }'
```

Response:

```json
{
  "id": "...",
  "name": "Payment Service",
  "key": "sk_a1b2c3d4e5f6...",
  "service": "payment-service",
  "isActive": true
}
```

### **Using API Keys**

Other services include the API key in requests:

```bash
curl http://localhost:3000/api/user \
  -H "X-API-Key: sk_a1b2c3d4e5f6..."
```

### **Configuration Options**

```typescript
apiKeyAuth: {
  enabled: true,
  headerName: 'x-api-key',                    // Custom header name
  publicRoutes: ['/health', '/documentation'], // Routes that don't require auth
  keyPrefix: 'sk_',                           // API key prefix
}
```

### **API Key Model Fields**

| Field        | Type      | Description                                     |
| ------------ | --------- | ----------------------------------------------- |
| `name`       | String    | Friendly name for the key                       |
| `key`        | String    | The actual API key (auto-generated, write-only) |
| `service`    | String    | Name of the service using this key              |
| `isActive`   | Boolean   | Enable/disable the key (default: true)          |
| `expiresAt`  | DateTime? | Optional expiration date                        |
| `lastUsedAt` | DateTime? | Last time the key was used (auto-updated)       |

**Note:** The `key` field is **auto-generated** and cannot be set by users. It uses the `writePrivate` property to prevent manual input while still being returned in responses.

For detailed documentation, see [API Key Authentication Guide](./API_KEY_AUTH.md).

---

## 5. Swagger / OpenAPI Documentation

All the above features are fully documented in the auto-generated Swagger UI (`/documentation`).

- **Populate**: The `populate` query parameter is documented for GET endpoints.
- **Foreign Keys**: Foreign key fields (e.g., `facilityId`) are visible in the schema.
- **Response Schema**: Response schemas include the potential related objects (e.g., `facility`).

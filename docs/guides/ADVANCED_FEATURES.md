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
  "message": "Unique constraint violation",
  "errors": [
    {
      "field": "email",
      "message": "Value must be unique"
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

---

## 4. Swagger / OpenAPI Documentation

All the above features are fully documented in the auto-generated Swagger UI (`/documentation`).

- **Populate**: The `populate` query parameter is documented for GET endpoints.
- **Foreign Keys**: Foreign key fields (e.g., `facilityId`) are visible in the schema.
- **Response Schema**: Response schemas include the potential related objects (e.g., `facility`).

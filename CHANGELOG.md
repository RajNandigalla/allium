# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added

- **`writePrivate` field property**: New field property to prevent user input on auto-generated fields while still including them in API responses
  - Use case: API keys, auto-generated UUIDs, system-managed timestamps
  - Example: `{ name: 'key', type: 'String', writePrivate: true }`
- **Field Properties Reference**: Comprehensive documentation of all available field properties at `docs/reference/field-properties.md`
- **Improved error messages**: Field-specific validation errors with clear, actionable messages
  - Unique constraint errors now show which field(s) are duplicated
  - Date validation errors include expected format with examples
  - Type mismatch errors specify expected type
  - Development mode includes detailed error information
- **Security Features**: Comprehensive security suite for production-ready APIs
  - **XSS Protection**: Input sanitization middleware with configurable exemptions
  - **CSRF Token Support**: Token-based protection against Cross-Site Request Forgery
  - **SQL Injection Detection**: Additional detection layer on top of Prisma's parameterized queries
  - **Enhanced Security Headers**: Production-ready defaults (CSP, HSTS, X-Frame-Options, Referrer-Policy)
  - **Key Rotation**: Versioned encryption keys for secure key rotation
  - **JSON Field Encryption**: Encrypt entire JSON objects with `encryptJSON` and `decryptJSON`

### Changed

- **API Key model**: The `key` field is now auto-generated and cannot be set by users
- **Error responses**: All error responses now include field-level details in the `errors` array
- **Unique constraint errors**: Message format changed from "Unique constraint violation" to "Unique constraint failed on field: {fieldName}"
- **Validation errors**: Now include specific field information instead of generic "Invalid data format"
- **Helmet plugin**: Now environment-aware with production-ready defaults when `NODE_ENV=production`

### Fixed

- Type definition mismatch for `publicRoutes` in API key authentication (now accepts both strings and route config objects)
- Generic 500 errors replaced with specific error messages and proper status codes
- Empty `errors` array in unique constraint violations

### Documentation

- Updated `docs/guides/ADVANCED_FEATURES.md` with improved error handling examples
- Added `docs/reference/field-properties.md` with complete field property reference
- Updated `README.md` to highlight `writePrivate` and improved error handling
- **Added `docs/guides/SECURITY.md`**: Comprehensive security guide covering all security features, configuration examples, threat model, and best practices
- Updated `README.md` with security features in key features list
- Updated `docs/ROADMAP.md` to mark security features as completed

---

## Example Migration

If you have existing API key creation logic that allows users to set the `key` field:

**Before:**

```typescript
// Users could set their own keys (security risk!)
POST /api/apikey
{
  "name": "My Service",
  "service": "my-service",
  "key": "my-custom-key"  // ❌ Accepted
}
```

**After:**

```typescript
// Key is auto-generated, user input is ignored
POST /api/apikey
{
  "name": "My Service",
  "service": "my-service"
  // "key" field is not in the schema
}

// Response includes auto-generated key
{
  "id": "...",
  "name": "My Service",
  "service": "my-service",
  "key": "sk_a1b2c3d4e5f6...",  // ✅ Auto-generated
  "isActive": true
}
```

---

## Error Response Examples

### Unique Constraint (Before vs After)

**Before:**

```json
{
  "statusCode": 409,
  "error": "Conflict",
  "message": "Unique constraint violation",
  "errors": [] // ❌ Empty!
}
```

**After:**

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

### Invalid Date Format (Before vs After)

**Before:**

```json
{
  "statusCode": 500,
  "error": "Internal Server Error",
  "message": "An unexpected error occurred"
}
```

**After:**

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

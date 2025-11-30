# Field Properties Reference

This document describes all available field properties in Allium model definitions.

## Basic Properties

### `name` (required)

- **Type:** `string`
- **Description:** The name of the field
- **Example:** `"name": "email"`

### `type` (required)

- **Type:** `FieldType`
- **Values:** `'String' | 'Int' | 'Float' | 'Boolean' | 'DateTime' | 'Json' | 'Enum'`
- **Description:** The data type of the field
- **Example:** `"type": "String"`

### `required`

- **Type:** `boolean`
- **Default:** `true`
- **Description:** Whether the field is required (NOT NULL in database)
- **Example:** `"required": false`

### `unique`

- **Type:** `boolean`
- **Default:** `false`
- **Description:** Whether the field must have unique values
- **Example:** `"unique": true`

### `default`

- **Type:** `string | number | boolean`
- **Description:** Default value for the field
- **Example:** `"default": true`

---

## Validation Properties

### `validation`

- **Type:** `ValidationRules`
- **Description:** Validation rules for the field
- **Properties:**
  - `min?: number` - Minimum value (for numbers)
  - `max?: number` - Maximum value (for numbers)
  - `minLength?: number` - Minimum string length
  - `maxLength?: number` - Maximum string length
  - `pattern?: string` - Regex pattern for validation
  - `enum?: string[]` - Allowed values

**Example:**

```json
{
  "name": "age",
  "type": "Int",
  "validation": {
    "min": 0,
    "max": 120
  }
}
```

### `values`

- **Type:** `string[]`
- **Description:** For Enum type fields, defines allowed values
- **Example:**

```json
{
  "name": "role",
  "type": "Enum",
  "values": ["user", "admin", "moderator"]
}
```

---

## Privacy & Security Properties

### `private`

- **Type:** `boolean`
- **Default:** `false`
- **Description:** If `true`, field is **excluded from API responses** (read and write)
- **Use Case:** Sensitive data that should never be exposed via API
- **Example:**

```json
{
  "name": "passwordHash",
  "type": "String",
  "private": true
}
```

### `writePrivate`

- **Type:** `boolean`
- **Default:** `false`
- **Description:** If `true`, field **cannot be set by users** but is **included in responses**
- **Use Case:** Auto-generated fields like API keys, UUIDs, timestamps
- **Example:**

```json
{
  "name": "key",
  "type": "String",
  "writePrivate": true // Auto-generated, users can't set it
}
```

**Comparison:**

| Property       | Can Read? | Can Write? | Use Case                     |
| -------------- | --------- | ---------- | ---------------------------- |
| `private`      | ❌ No     | ❌ No      | Passwords, internal data     |
| `writePrivate` | ✅ Yes    | ❌ No      | API keys, auto-generated IDs |

### `encrypted`

- **Type:** `boolean`
- **Default:** `false`
- **Description:** If `true`, field will be encrypted at rest
- **Example:**

```json
{
  "name": "ssn",
  "type": "String",
  "encrypted": true
}
```

### `masked`

- **Type:** `MaskPattern`
- **Description:** Masking configuration for sensitive data in responses
- **Values:**
  - `'creditCard'` - Shows last 4 digits: `****1234`
  - `'ssn'` - Shows last 4 digits: `***-**-1234`
  - `'phone'` - Shows last 4 digits: `***-***-1234`
  - `'email'` - Shows first char and domain: `j***@example.com`
  - Custom pattern object
  - Custom function

**Example:**

```json
{
  "name": "creditCard",
  "type": "String",
  "masked": "creditCard"
}
```

---

## Computed & Virtual Properties

### `computed`

- **Type:** `ComputedFieldConfig`
- **Description:** Define computed/virtual fields
- **Properties:**
  - `template?: string` - Template-based computation
  - `transform?: (record) => any` - Function-based (TypeScript only)

**Example (Template):**

```json
{
  "name": "fullName",
  "type": "String",
  "computed": {
    "template": "{firstName} {lastName}"
  }
}
```

**Example (Function - TypeScript only):**

```typescript
{
  name: 'totalPrice',
  type: 'Float',
  computed: {
    transform: (record) => record.price * record.quantity
  }
}
```

### `virtual`

- **Type:** `boolean`
- **Description:** Auto-set to `true` when `computed` is present
- **Note:** Virtual fields are not stored in the database

---

## Advanced Properties

### `jsonSchema`

- **Type:** `Record<string, any>`
- **Description:** Custom JSON Schema definition for validation
- **Example:**

```json
{
  "name": "metadata",
  "type": "Json",
  "jsonSchema": {
    "type": "object",
    "properties": {
      "tags": { "type": "array" }
    }
  }
}
```

### `hasTransform`

- **Type:** `boolean`
- **Description:** Auto-set to `true` when using `transform` function in computed fields

### `hasMaskTransform`

- **Type:** `boolean`
- **Description:** Auto-set to `true` when using custom masking function

---

## Complete Example

```json
{
  "name": "User",
  "fields": [
    {
      "name": "email",
      "type": "String",
      "required": true,
      "unique": true,
      "validation": {
        "pattern": "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
      }
    },
    {
      "name": "passwordHash",
      "type": "String",
      "required": true,
      "private": true
    },
    {
      "name": "apiKey",
      "type": "String",
      "unique": true,
      "writePrivate": true
    },
    {
      "name": "role",
      "type": "Enum",
      "values": ["user", "admin"],
      "default": "user"
    },
    {
      "name": "age",
      "type": "Int",
      "required": false,
      "validation": {
        "min": 0,
        "max": 120
      }
    },
    {
      "name": "creditCard",
      "type": "String",
      "required": false,
      "masked": "creditCard"
    }
  ]
}
```

---

## TypeScript Interface

```typescript
export interface Field {
  name: string;
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  default?: string | number | boolean;
  validation?: ValidationRules;
  values?: string[];
  private?: boolean;
  writePrivate?: boolean;
  masked?: MaskPattern;
  encrypted?: boolean;
  virtual?: boolean;
  computed?: ComputedFieldConfig;
  jsonSchema?: Record<string, any>;
  hasTransform?: boolean;
  hasMaskTransform?: boolean;
}
```

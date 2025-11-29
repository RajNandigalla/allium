# Hidden Generation Architecture

## Overview

Allium now uses a **hidden generation architecture** where all generated code lives in `.allium/generated/` and is invisible to users unless they explicitly override it. This creates a cleaner project structure and reduces noise.

## Key Concepts

### 1. Hidden Generation Directory

All generated files are stored in `.allium/generated/modules/`:

```
.allium/
└── generated/
    └── modules/
        └── user/
            ├── user.service.ts
            ├── user.controller.ts
            ├── user.routes.ts
            ├── user.schema.ts
            └── user.resolver.ts
```

This directory is gitignored automatically.

### 2. Public Module Directory

The `src/modules/` directory only contains:

- `index.ts` (auto-generated export file)
- `overrides/` (user-created customizations)

```
src/modules/user/
├── index.ts              (auto-generated, exports correct impl)
└── overrides/            (only if user creates)
    ├── user.service.ts   (extends generated)
    └── findByEmail.ts    (custom method)
```

### 3. Smart Index Exports

The `index.ts` file automatically exports either the generated or override implementation:

```typescript
// If no override exists
export * from '../../../.allium/generated/modules/user/user.service';

// If override exists
export * from './overrides/user.service';
```

## Workflow

### 1. Define Models

Edit `models.json` with your model definitions:

```json
{
  "models": [
    {
      "name": "User",
      "fields": [
        { "name": "email", "type": "String", "unique": true },
        { "name": "name", "type": "String" }
      ],
      "api": {
        "prefix": "/api/users",
        "operations": ["create", "read", "update", "delete"]
      }
    }
  ]
}
```

### 2. Generate Code

Run the sync command:

```bash
allium sync
```

This generates all files to `.allium/generated/` and creates index exports. Your API is immediately functional.

### 3. Create Overrides (Optional)

If you need to customize behavior, use the override command:

```bash
allium override User service
```

This creates `src/modules/user/overrides/user.service.ts` with a template that extends the generated service:

```typescript
import { UserService as GeneratedUserService } from '../../../../.allium/generated/modules/user/user.service';

export class UserService extends GeneratedUserService {
  // Add custom methods or override existing ones
  async findByEmail(email: string) {
    return this.prisma.user.findUnique({ where: { email } });
  }
}

export const userService = new UserService();
```

### 4. Sync Again

Run `allium sync` again. The index.ts will now export your override instead of the generated version.

## Enhanced Model Configuration

### Service Configuration

```json
{
  "service": {
    "methods": {
      "findAll": { "pagination": true },
      "delete": { "softDelete": true }
    },
    "hooks": {
      "beforeCreate": "hashPassword",
      "afterCreate": "sendWelcomeEmail"
    },
    "customMethods": [{ "name": "findByEmail", "description": "Find by email" }]
  }
}
```

### Route Configuration

```json
{
  "routes": {
    "create": {
      "middleware": ["validateEmail"],
      "rateLimit": { "max": 5, "timeWindow": "1m" }
    },
    "findAll": {
      "auth": ["admin", "moderator"]
    }
  }
}
```

### Controller Configuration

```json
{
  "controller": {
    "validation": {
      "create": {
        "email": "z.string().email()",
        "age": "z.number().min(18)"
      }
    }
  }
}
```

## Commands

### `allium sync`

Generates code from model definitions to `.allium/generated/` and creates/updates index exports.

### `allium override <model> <layer>`

Creates an override template for a specific model layer.

**Layers**: `service`, `controller`, `routes`

**Example**:

```bash
allium override User service
allium override Product controller
```

## Benefits

1. **Clean Codebase**: Only see files you customize
2. **No Merge Conflicts**: Generated code is separate from custom code
3. **Easy Updates**: Regenerate anytime without losing customizations
4. **Clear Intent**: Override files clearly show what's customized
5. **Type Safety**: Overrides extend generated classes, maintaining type safety

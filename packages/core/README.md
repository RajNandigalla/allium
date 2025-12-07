# @allium/core

The core runtime and utility library for the Allium framework. This package provides the foundational building blocks for defining models, managing caching, and executing hooks.

## Installation

```bash
npm install @allium/core
```

## Features

- **Model Registry**: Centralized management of model definitions.
- **Runtime Introspection**: inspect model schemas at runtime.
- **Hook System**: Powerful lifecycle hooks for data operations.
- **Caching**: Flexible caching service with Redis support.
- **Utilities**: Helpers for i18n, cache key generation, and more.

## Usage

### Registering Models

Define your models using JSON or TypeScript and register them with the core runtime.

```typescript
import { registerModel } from '@allium/core';

// simple registration
registerModel('User', {
  // hooks and custom functions
  functions: {
    transformEmail: (data) => data.email.toLowerCase(),
  },
});
```

### Caching

Use the built-in `CacheService` to manage application state and data caching.

```typescript
import { getCacheService } from '@allium/core';

const cache = getCacheService({
  enable: true,
  ttl: 60, // seconds
  provider: 'memory', // or 'redis'
});

await cache.set('key', 'value');
const val = await cache.get('key');
```

For Redis support:

```typescript
const cache = getCacheService({
  enable: true,
  provider: 'redis',
  redisUrl: process.env.REDIS_URL,
});
```

### Utilities

#### Cache Key Generation

Generate consistent cache keys for your data.

```typescript
import { generateRecordKey, generateListKey } from '@allium/core';

const recordKey = generateRecordKey('User', '123'); // "User:123"
const listKey = generateListKey('User', { page: 1 }); // "User:list:..."
```

#### Translation

Simple i18n helper.

```typescript
import { translate } from '@allium/core';

const message = translate('errors.validation.required', 'en');
```

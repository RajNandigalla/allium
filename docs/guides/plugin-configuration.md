# Namespaced Plugin Configuration Guide

## Overview

The `initAllium` function now supports namespaced configuration, allowing you to pass specific options to individual plugins while keeping your configuration organized and type-safe.

## Configuration Structure

```typescript
import { initAllium } from '@allium/fastify';
import { autoLoadModels } from '@allium/core';
import path from 'path';

const models = await autoLoadModels(path.join(__dirname, 'models'));

const app = await initAllium({
  // Allium-specific options
  models,
  routePrefix: '/api',

  // Required: Prisma configuration
  prisma: {
    datasourceUrl: process.env.DATABASE_URL || 'file:./dev.db',
  },

  // Optional: Plugin-specific configurations
  swagger: {
    mode: 'dynamic',
    openapi: {
      info: {
        title: 'My API',
        version: '1.0.0',
        description: 'My awesome API',
      },
    },
  },

  cors: {
    origin: '*',
    credentials: true,
  },

  helmet: {
    contentSecurityPolicy: false,
  },

  rateLimit: {
    max: 100,
    timeWindow: '1 minute',
  },

  compress: {
    global: true,
    threshold: 1024,
  },

  sensible: {
    // sensible plugin options
  },

  // Fastify server options
  server: {
    logger: true,
    trustProxy: true,
  },
});

await app.listen({ port: 3000 });
```

## How It Works

1. **Namespacing**: Each plugin has its own namespace in the config object
2. **AutoLoad**: The `app.ts` passes all options to AutoLoad
3. **Plugin Extraction**: Each plugin extracts only its namespace from `opts`

### Example: Swagger Plugin

```typescript
// In swagger.ts
export default fp(async (fastify: FastifyInstance, opts: any) => {
  // Extract swagger config from opts
  const swaggerConfig = opts.swagger || {};

  // Merge with defaults
  const config = {
    mode: swaggerConfig.mode || 'dynamic',
    openapi:
      swaggerConfig.openapi ||
      {
        /* defaults */
      },
    ...swaggerConfig,
  };

  await fastify.register(swagger, config);
});
```

## Available Plugin Configurations

All plugins now expose their full configuration options using their native types. You can override any default or provide any option supported by the underlying Fastify plugin.

### Swagger (Optional)

Uses `FastifySwaggerOptions` from `@fastify/swagger`.

```typescript
swagger?: FastifySwaggerOptions;
```

### CORS (Optional)

Uses `FastifyCorsOptions` from `@fastify/cors`.

```typescript
cors?: FastifyCorsOptions;
```

### Helmet (Optional)

Uses `FastifyHelmetOptions` from `@fastify/helmet`.

```typescript
helmet?: FastifyHelmetOptions;
```

### Rate Limit (Optional)

Uses `RateLimitPluginOptions` from `@fastify/rate-limit`.

```typescript
rateLimit?: RateLimitPluginOptions;
```

### Compress (Optional)

Uses `FastifyCompressOptions` from `@fastify/compress`.

```typescript
compress?: FastifyCompressOptions;
```

### Sensible (Optional)

Uses `FastifySensibleOptions` from `@fastify/sensible`.

```typescript
sensible?: FastifySensibleOptions;
```

### Security (Optional)

Configure comprehensive security features including XSS protection, CSRF tokens, SQL injection detection, and encryption.

```typescript
security?: {
  xss?: {
    enabled?: boolean;
    whiteList?: Record<string, string[]>;
    exemptRoutes?: string[];
    exemptFields?: string[];
  };
  csrf?: {
    enabled?: boolean;
    cookieOpts?: {
      signed?: boolean;
      httpOnly?: boolean;
      sameSite?: 'strict' | 'lax' | 'none';
      secure?: boolean;
      path?: string;
      domain?: string;
    };
    exemptRoutes?: string[];
    sessionKey?: string;
    cookieSecret?: string;
  };
  sqlInjectionGuard?: {
    enabled?: boolean;
    logOnly?: boolean;
    exemptRoutes?: string[];
  };
  encryption?: {
    keyRotation?: {
      enabled?: boolean;
      keys?: Record<number, string>;
      currentVersion?: number;
    };
  };
};
```

**Example**:

```typescript
const app = await initAllium({
  models,
  prisma: { datasourceUrl: process.env.DATABASE_URL },
  security: {
    xss: {
      enabled: true,
      exemptRoutes: ['/api/content/*'],
      exemptFields: ['htmlContent'],
    },
    csrf: {
      enabled: true,
      cookieOpts: {
        signed: true,
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === 'production',
      },
      exemptRoutes: ['/api/webhooks/*'],
    },
    sqlInjectionGuard: {
      enabled: true,
      logOnly: false,
    },
    encryption: {
      keyRotation: {
        enabled: true,
        keys: {
          1: process.env.ENCRYPTION_KEY_V1,
          2: process.env.ENCRYPTION_KEY_V2,
        },
        currentVersion: 2,
      },
    },
  },
});
```

See the [Security Guide](./SECURITY.md) for detailed documentation.

## Benefits

✅ **Type-Safe**: Full TypeScript support with autocomplete
✅ **Organized**: Each plugin's config is clearly separated
✅ **Flexible**: Override defaults or use them as-is
✅ **Extensible**: Add custom plugin configs easily
✅ **Clean**: No need to manually register plugins

## Adding Custom Plugins

To add your own plugin configuration:

1. Add the namespace to `AlliumServerConfig`:

```typescript
export interface AlliumServerConfig extends AlliumPluginOptions {
  // ... existing configs

  myPlugin?: {
    option1?: string;
    option2?: number;
  };
}
```

2. Update your plugin to extract its config:

```typescript
export default fp(async (fastify, opts) => {
  const config = opts.myPlugin || {};
  // Use config...
});
```

3. Use it in `initAllium`:

```typescript
const app = await initAllium({
  models,
  prisma: {
    /* ... */
  },
  myPlugin: {
    option1: 'value',
    option2: 42,
  },
});
```

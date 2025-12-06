# Security Quick Reference

Quick reference for configuring security features in Allium.

## Environment Variables

```bash
# Required for encrypted fields
ENCRYPTION_KEY=your-32-character-or-longer-secret-key

# Optional: For key rotation
ENCRYPTION_KEY_V1=old-key-32-chars-or-longer
ENCRYPTION_KEY_V2=new-key-32-chars-or-longer

# Optional: For CSRF protection
COOKIE_SECRET=your-random-secret-for-cookie-signing

# Production mode (enables security headers by default)
NODE_ENV=production
```

## Basic Configuration

```typescript
import { initAllium } from '@allium/fastify';

const app = await initAllium({
  models,
  prisma: { datasourceUrl: process.env.DATABASE_URL },

  // Enable all security features
  security: {
    xss: { enabled: true },
    csrf: { enabled: true },
    sqlInjectionGuard: { enabled: true },
  },
});
```

## Feature-Specific Configuration

### XSS Protection

```typescript
security: {
  xss: {
    enabled: true,
    exemptRoutes: ['/api/content/*'],  // Routes that allow HTML
    exemptFields: ['htmlContent'],      // Fields that allow HTML
    whiteList: {                        // Custom allowed tags
      a: ['href', 'title'],
      b: [],
      i: []
    }
  }
}
```

### CSRF Protection

```typescript
security: {
  csrf: {
    enabled: true,
    cookieOpts: {
      signed: true,
      httpOnly: true,
      sameSite: 'strict',
      secure: true  // Requires HTTPS
    },
    exemptRoutes: ['/api/webhooks/*', '/api/public/*'],
    cookieSecret: process.env.COOKIE_SECRET
  }
}
```

**Frontend Integration**:

```javascript
// 1. Fetch token
const { csrfToken } = await fetch('/api/csrf-token').then((r) => r.json());

// 2. Include in requests
fetch('/api/users', {
  method: 'POST',
  headers: { 'x-csrf-token': csrfToken },
  body: JSON.stringify({ name: 'John' }),
});
```

### SQL Injection Detection

```typescript
security: {
  sqlInjectionGuard: {
    enabled: true,
    logOnly: false,  // Set to true for monitoring only
    exemptRoutes: ['/api/admin/*']
  }
}
```

### Security Headers

```typescript
helmet: {
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://cdn.example.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,  // 1 year
    includeSubDomains: true,
    preload: true
  }
}
```

### Encryption & Key Rotation

```typescript
security: {
  encryption: {
    keyRotation: {
      enabled: true,
      keys: {
        1: process.env.ENCRYPTION_KEY_V1,
        2: process.env.ENCRYPTION_KEY_V2
      },
      currentVersion: 2  // Use v2 for new encryptions
    }
  }
}
```

**Model Configuration**:

```json
{
  "name": "User",
  "fields": [
    {
      "name": "ssn",
      "type": "String",
      "encrypted": true
    }
  ]
}
```

## Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS
- [ ] Configure strong `ENCRYPTION_KEY` (32+ chars)
- [ ] Enable XSS protection
- [ ] Enable CSRF protection (for web apps)
- [ ] Enable SQL injection detection
- [ ] Review security headers (CSP, HSTS)
- [ ] Configure rate limiting
- [ ] Set up API key authentication
- [ ] Review exempt routes and fields
- [ ] Test security features

## Testing Commands

```bash
# Test XSS Protection
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "<script>alert(\"XSS\")</script>"}'

# Test SQL Injection Detection
curl -X GET "http://localhost:3000/api/users?filters[name][\$eq]=admin'--"

# Test CSRF Protection
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John"}'

# Test Security Headers
curl -I http://localhost:3000/api/users
```

## Common Patterns

### Public API with Security

```typescript
const app = await initAllium({
  models,
  prisma: { datasourceUrl: process.env.DATABASE_URL },
  security: {
    xss: { enabled: true },
    sqlInjectionGuard: { enabled: true },
    csrf: {
      enabled: true,
      exemptRoutes: ['/api/public/*'], // Public endpoints
    },
  },
  apiKeyAuth: {
    enabled: true,
    publicRoutes: ['/health', '/api/public/*'],
  },
});
```

### Content Management System

```typescript
const app = await initAllium({
  models,
  prisma: { datasourceUrl: process.env.DATABASE_URL },
  security: {
    xss: {
      enabled: true,
      exemptFields: ['htmlContent', 'richText'], // Allow HTML in content
      exemptRoutes: ['/api/content/*'],
    },
    csrf: { enabled: true },
    sqlInjectionGuard: { enabled: true },
  },
});
```

### Webhook Receiver

```typescript
const app = await initAllium({
  models,
  prisma: { datasourceUrl: process.env.DATABASE_URL },
  security: {
    xss: { enabled: true },
    sqlInjectionGuard: { enabled: true },
    csrf: {
      enabled: true,
      exemptRoutes: ['/api/webhooks/*'], // Webhooks don't have CSRF tokens
    },
  },
});
```

## Performance

| Feature                 | Overhead         |
| ----------------------- | ---------------- |
| XSS Sanitization        | ~1-3ms           |
| SQL Injection Detection | ~0.5-1ms         |
| CSRF Validation         | ~0.5ms           |
| Security Headers        | Negligible       |
| Field Encryption        | ~2-5ms per field |

**Total**: ~2-5ms per request with all features enabled

## See Also

- [Complete Security Guide](./SECURITY.md)
- [Plugin Configuration](./plugin-configuration.md)
- [API Key Authentication](./API_KEY_AUTH.md)

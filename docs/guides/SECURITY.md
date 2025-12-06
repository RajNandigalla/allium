# Security Guide

## Overview

Allium provides comprehensive security features to protect your API against common vulnerabilities. This guide covers all security features and best practices for production deployment.

## Security Features

### ✅ SQL Injection Prevention

**Status**: Built-in + Additional Layer

Allium uses Prisma ORM which provides parameterized queries, preventing SQL injection by default. An additional detection layer is available for defense-in-depth.

**Configuration**:

```typescript
const app = await initAllium({
  models,
  prisma: { datasourceUrl: process.env.DATABASE_URL },
  security: {
    sqlInjectionGuard: {
      enabled: true,
      logOnly: false, // Set to true for monitoring without blocking
      exemptRoutes: ['/api/admin/*'], // Routes to skip detection
    },
  },
});
```

**What it detects**:

- SQL keywords in unexpected contexts
- SQL comments (`--`, `/*`, `*/`)
- Union-based injection attempts
- Stacked queries
- Invalid filter operators in Strapi-style queries

---

### ✅ XSS Protection

**Status**: Opt-in

Sanitizes request inputs to prevent Cross-Site Scripting attacks.

**Configuration**:

```typescript
const app = await initAllium({
  models,
  prisma: { datasourceUrl: process.env.DATABASE_URL },
  security: {
    xss: {
      enabled: true,
      exemptRoutes: ['/api/content/*'], // Routes that allow HTML
      exemptFields: ['htmlContent', 'richText'], // Fields that allow HTML
      whiteList: {
        // Custom allowed HTML tags (optional)
        a: ['href', 'title'],
        b: [],
        i: [],
      },
    },
  },
});
```

**How it works**:

- Recursively sanitizes all string values in request body, query params, and route params
- Removes dangerous HTML tags and event handlers
- Preserves data types (numbers, booleans, etc.)
- Configurable per-route and per-field exemptions

---

### ✅ CSRF Protection

**Status**: Opt-in

Protects against Cross-Site Request Forgery attacks using token-based validation.

**Configuration**:

```typescript
const app = await initAllium({
  models,
  prisma: { datasourceUrl: process.env.DATABASE_URL },
  security: {
    csrf: {
      enabled: true,
      cookieOpts: {
        signed: true,
        httpOnly: true,
        sameSite: 'strict',
        secure: true, // Set to true in production with HTTPS
      },
      exemptRoutes: ['/api/webhooks/*', '/api/public/*'],
      cookieSecret: process.env.COOKIE_SECRET, // Optional, auto-generated if not provided
    },
  },
});
```

**Frontend Integration**:

```javascript
// 1. Fetch CSRF token
const response = await fetch('/api/csrf-token');
const { csrfToken } = await response.json();

// 2. Include token in state-changing requests
await fetch('/api/users', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-csrf-token': csrfToken,
  },
  body: JSON.stringify({ name: 'John Doe' }),
});
```

**Automatic Validation**:

- GET, HEAD, OPTIONS requests are exempt
- POST, PUT, PATCH, DELETE requests require valid CSRF token
- Documentation routes (`/documentation`, `/swagger`) are automatically exempt

---

### ✅ Security Headers

**Status**: Enabled by default (environment-aware)

Configures HTTP security headers using Helmet.

**Default Configuration**:

**Production Mode** (`NODE_ENV=production`):

- Content-Security-Policy (CSP)
- Strict-Transport-Security (HSTS)
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- Referrer-Policy: strict-origin-when-cross-origin
- Permissions-Policy (camera, microphone, geolocation disabled)

**Development Mode**:

- Permissive settings for Swagger UI and development tools
- CSP disabled to allow inline scripts

**Custom Configuration**:

```typescript
const app = await initAllium({
  models,
  prisma: { datasourceUrl: process.env.DATABASE_URL },
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.example.com'],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", 'https://api.example.com'],
      },
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true,
    },
  },
});
```

**Force Production Defaults in Development**:

```typescript
helmet: {
  enableProductionDefaults: true;
}
```

---

### ✅ Encryption at Rest

**Status**: Built-in with enhancements

Encrypt sensitive fields using AES-256-GCM encryption.

**Basic Usage**:

```json
{
  "name": "User",
  "fields": [
    {
      "name": "ssn",
      "type": "String",
      "encrypted": true
    },
    {
      "name": "creditCard",
      "type": "String",
      "encrypted": true,
      "masked": true
    }
  ]
}
```

**Environment Setup**:

```bash
# .env
ENCRYPTION_KEY=your-32-character-or-longer-secret-key-here
```

**Key Rotation** (New):

```typescript
const app = await initAllium({
  models,
  prisma: { datasourceUrl: process.env.DATABASE_URL },
  security: {
    encryption: {
      keyRotation: {
        enabled: true,
        keys: {
          1: process.env.ENCRYPTION_KEY_V1,
          2: process.env.ENCRYPTION_KEY_V2, // New key
        },
        currentVersion: 2, // Use version 2 for new encryptions
      },
    },
  },
});
```

**How it works**:

- Data encrypted with version 2 key: `2:encryptedData`
- Data encrypted with version 1 key can still be decrypted
- Gradual migration: re-encrypt on update

**JSON Field Encryption** (New):

```typescript
import { encryptJSON, decryptJSON } from '@allium/core';

// Encrypt entire JSON object
const encrypted = encryptJSON(
  {
    cardNumber: '1234-5678-9012-3456',
    cvv: '123',
  },
  process.env.ENCRYPTION_KEY
);

// Decrypt
const decrypted = decryptJSON(encrypted, process.env.ENCRYPTION_KEY);
```

---

## Security Checklist

### Development

- [ ] Use strong `ENCRYPTION_KEY` (32+ characters)
- [ ] Enable XSS protection for user-facing APIs
- [ ] Configure CSRF protection for web applications
- [ ] Test security features with sample payloads
- [ ] Review exempt routes and fields

### Production

- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS (required for secure cookies)
- [ ] Configure HSTS with `preload: true`
- [ ] Review and customize CSP directives
- [ ] Enable SQL injection detection (`logOnly: false`)
- [ ] Use strong `COOKIE_SECRET` for CSRF
- [ ] Implement key rotation for encrypted fields
- [ ] Configure rate limiting
- [ ] Enable API key authentication for service-to-service calls
- [ ] Review security headers in browser DevTools
- [ ] Set up security monitoring and alerting

---

## Threat Model

### Mitigated Threats

| Threat              | Mitigation                                     | Status |
| ------------------- | ---------------------------------------------- | ------ |
| SQL Injection       | Prisma parameterized queries + detection layer | ✅     |
| XSS (Stored)        | Input sanitization middleware                  | ✅     |
| XSS (Reflected)     | Input sanitization + CSP headers               | ✅     |
| CSRF                | Token-based validation                         | ✅     |
| Clickjacking        | X-Frame-Options header                         | ✅     |
| MIME Sniffing       | X-Content-Type-Options header                  | ✅     |
| Man-in-the-Middle   | HSTS header (requires HTTPS)                   | ✅     |
| Data Leakage        | Encrypted fields + masked fields               | ✅     |
| Brute Force         | Rate limiting                                  | ✅     |
| Unauthorized Access | API key authentication                         | ✅     |

### Additional Recommendations

- **Input Validation**: Use field validation rules (`min`, `max`, `pattern`)
- **Output Encoding**: Handled automatically by JSON responses
- **Session Management**: Use `@fastify/session` with secure settings
- **Logging**: Enable security event logging (SQL injection attempts, CSRF failures)
- **Monitoring**: Track failed authentication attempts, unusual patterns
- **Updates**: Keep dependencies updated (`npm audit`, Dependabot)

---

## Examples

### Full Security Configuration

```typescript
import { initAllium } from '@allium/fastify';
import { autoLoadModels } from '@allium/core';
import path from 'path';

const models = await autoLoadModels(path.join(__dirname, 'models'));

const app = await initAllium({
  // Models
  models,

  // Database
  prisma: {
    datasourceUrl: process.env.DATABASE_URL,
  },

  // Security
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

  // Security Headers
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  },

  // Rate Limiting
  rateLimit: {
    max: 100,
    timeWindow: '1 minute',
  },

  // API Key Authentication
  apiKeyAuth: {
    enabled: true,
    publicRoutes: ['/health', '/documentation'],
  },
});

await app.listen({
  port: 3000,
  host: '0.0.0.0',
});
```

### Testing Security Features

```bash
# Test XSS Protection
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "<script>alert(\"XSS\")</script>"}'
# Expected: Script tags removed

# Test SQL Injection Detection
curl -X GET "http://localhost:3000/api/users?filters[name][\$eq]=admin'--"
# Expected: 400 Bad Request (potential security violation)

# Test CSRF Protection
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name": "John"}'
# Expected: 403 Forbidden (missing CSRF token)

# Test with CSRF Token
TOKEN=$(curl -s http://localhost:3000/api/csrf-token | jq -r '.csrfToken')
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "x-csrf-token: $TOKEN" \
  -d '{"name": "John"}'
# Expected: 201 Created
```

---

## Performance Impact

| Feature                 | Overhead             | Recommendation              |
| ----------------------- | -------------------- | --------------------------- |
| XSS Sanitization        | ~1-3ms per request   | Enable for user-facing APIs |
| SQL Injection Detection | ~0.5-1ms per request | Enable in production        |
| CSRF Validation         | ~0.5ms per request   | Enable for web apps         |
| Security Headers        | Negligible           | Always enable               |
| Field Encryption        | ~2-5ms per field     | Use for sensitive data only |

---

## Troubleshooting

### CSRF Token Issues

**Problem**: "Invalid CSRF token" errors

**Solutions**:

- Ensure cookies are enabled in the browser
- Check `sameSite` setting (use `lax` for cross-origin requests)
- Verify `secure: true` is only set when using HTTPS
- Add route to `exemptRoutes` if needed

### XSS Sanitization Breaking Content

**Problem**: Legitimate HTML is being removed

**Solutions**:

- Add field to `exemptFields`
- Add route to `exemptRoutes`
- Customize `whiteList` to allow specific tags

### SQL Injection False Positives

**Problem**: Legitimate queries are being blocked

**Solutions**:

- Set `logOnly: true` to monitor without blocking
- Add route to `exemptRoutes`
- Review and adjust detection patterns

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Fastify Security Best Practices](https://www.fastify.io/docs/latest/Guides/Getting-Started/#security)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [CSRF Protection Guide](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)

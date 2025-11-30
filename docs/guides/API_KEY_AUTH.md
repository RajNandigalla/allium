# Built-in API Key Authentication

Allium now includes **built-in API key authentication** for service-to-service communication. No manual setup required!

## Quick Start

### 1. Enable Authentication

In your `src/app.ts`:

```typescript
import { initAllium } from '@allium/fastify';
import { User, Product } from './models';

const app = await initAllium({
  models: [User, Product], // No need to import ApiKey manually

  // Enable API key authentication
  apiKeyAuth: {
    enabled: true,
  },

  prisma: {
    datasourceUrl: 'file:./dev.db',
    provider: 'sqlite',
  },
});

await app.listen({ port: 3000 });
```

### 2. Sync and Generate

```bash
yarn allium sync
yarn allium db generate
yarn allium db push
```

That's it! Allium will:

1. ✅ Automatically generate the `ApiKey` table in your database
2. ✅ Protect all routes (except `/documentation` and `/health`)
3. ✅ Validate API keys from the `X-API-Key` header

## Configuration Options

```typescript
apiKeyAuth: {
  enabled: true,                              // Enable/disable authentication
  headerName: 'x-api-key',                    // Custom header name
  publicRoutes: ['/health', '/documentation'], // Routes that don't require auth
  keyPrefix: 'sk_',                           // API key prefix
}
```

## Creating API Keys

### Option 1: Via API

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
  "isActive": true,
  "createdAt": "..."
}
```

### Option 2: Via Prisma Studio

```bash
npx prisma studio
```

Navigate to the `ApiKey` model and create a new record. The key will be auto-generated.

## Using API Keys

Other services include the API key in the `X-API-Key` header:

```bash
curl http://localhost:3000/api/user \
  -H "X-API-Key: sk_a1b2c3d4e5f6..."
```

```javascript
// Node.js
const response = await fetch('http://localhost:3000/api/user', {
  headers: {
    'X-API-Key': 'sk_a1b2c3d4e5f6...',
  },
});
```

```python
# Python
import requests

response = requests.get(
    'http://localhost:3000/api/user',
    headers={'X-API-Key': 'sk_a1b2c3d4e5f6...'}
)
```

## API Key Model

The built-in `ApiKey` model includes:

| Field        | Type      | Description                         |
| ------------ | --------- | ----------------------------------- |
| `id`         | String    | Unique identifier                   |
| `name`       | String    | Friendly name for the key           |
| `key`        | String    | The actual API key (auto-generated) |
| `service`    | String    | Name of the service using this key  |
| `isActive`   | Boolean   | Enable/disable the key              |
| `expiresAt`  | DateTime? | Optional expiration date            |
| `lastUsedAt` | DateTime? | Last time the key was used          |
| `createdAt`  | DateTime  | When the key was created            |
| `updatedAt`  | DateTime  | Last update timestamp               |

## Managing API Keys

### Deactivate a key:

```bash
curl -X PATCH http://localhost:3000/api/apikey/{id} \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

### Set expiration:

```bash
curl -X PATCH http://localhost:3000/api/apikey/{id} \
  -H "Content-Type: application/json" \
  -d '{"expiresAt": "2025-12-31T23:59:59Z"}'
```

### Delete a key:

```bash
curl -X DELETE http://localhost:3000/api/apikey/{id}
```

## Security Best Practices

1. **Never commit API keys to version control**
2. **Use environment variables** in calling services
3. **Rotate keys regularly** using `expiresAt`
4. **Monitor `lastUsedAt`** to detect unused/compromised keys
5. **Use HTTPS in production** to encrypt keys in transit
6. **Deactivate instead of delete** to maintain audit trails

## Advanced: Custom Public Routes

If you have custom routes that shouldn't require authentication:

```typescript
apiKeyAuth: {
  enabled: true,
  publicRoutes: [
    '/health',
    '/documentation',
    '/api/public',      // Your custom public route
    '/webhooks',        // Webhook endpoints
  ],
}
```

## Advanced: Custom Header Name

If you prefer a different header:

```typescript
apiKeyAuth: {
  enabled: true,
  headerName: 'authorization', // Use Authorization header instead
}
```

Then clients would send:

```bash
curl http://localhost:3000/api/user \
  -H "Authorization: sk_a1b2c3d4e5f6..."
```

## Disabling Authentication

To disable authentication (e.g., for development):

```typescript
apiKeyAuth: {
  enabled: false, // or just omit the apiKeyAuth config entirely
}
```

## What's Next?

- The `ApiKey` model is just like any other Allium model
- You can add custom hooks, validation, or fields
- You can customize the CRUD endpoints
- You can add relations to other models (e.g., link keys to users)

For more advanced authentication (JWT, OAuth), see the [Authentication Guide](./AUTHENTICATION.md).

## Managing Keys Across Environments

For production deployments with multiple environments (dev, UAT, production), see the [Multi-Environment Key Management Guide](./MULTI_ENVIRONMENT_KEYS.md) which covers:

- Setting up separate databases per environment
- Generating environment-specific keys
- Securely sharing keys with services
- Key rotation strategies
- Using secrets management services (AWS, GCP, Vault)

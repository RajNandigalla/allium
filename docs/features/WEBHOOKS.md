# Webhooks

Allium comes with a built-in webhook system that allows your application to notify external systems about events.

## Overview

The Webhook system consists of:

1.  **Webhook Model**: A database model to store webhook subscriptions.
2.  **Webhook Service**: A service to trigger events and dispatch webhooks.
3.  **Delivery Mechanism**: Asynchronous HTTP POST requests with retry capabilities (implementation dependent).

## Usage

### 1. Registering a Webhook

You can register a webhook via the Admin Panel, the API, or programmatically using Prisma.

#### Option A: Admin Panel / API

`POST /_admin/webhook`

> **Note**: Webhook routes are under `/_admin` for security. These routes should be protected in production.

#### Option B: Programmatic (Prisma)

You can seed or manage webhooks directly in your code (e.g. in `src/app.ts` after initialization, or in a seed script).

> **Note**: Ensure you have run `allium sync` and `allium db push` so that the `Webhook` table and types exist.

```typescript
// Example: Registering a webhook on startup in src/app.ts
const app = await initAllium({ ... });

// Wait for ready
await app.ready();

// Use the Prisma instance attached to the app
await app.prisma.webhook.create({
  data: {
    url: 'https://api.example.com/webhooks/users',
    events: ['user.created'],
    secret: 'whsec_...',
    active: true,
  },
});
```

**Fields:**

- `url` (String, required): The endpoint URL to receive the webhook.
- `events` (Json, required): Array of event names to subscribe to (e.g., `['user.created', 'order.paid']`) or `['*']` for all events.
- `secret` (String, optional): A secret key to sign the webhook payload for security.
- `active` (Boolean): whether the webhook is enabled.

### 2. Triggering an Event

Inject `webhooks` service and call the `trigger` method.

```typescript
// Inside a route or service
fastify.post('/users', async (req, reply) => {
  const user = await fastify.prisma.user.create({ ... });

  // Trigger event
  // Fire-and-forget; does not block the response
  fastify.webhooks.trigger('user.created', user);

  return user;
});
```

### 3. Receiving Webhooks

Allium sends a `POST` request to the registered URL.

**Headers:**

- `Content-Type`: `application/json`
- `User-Agent`: `Allium-Webhook/1.0`
- `X-Allium-Event`: The name of the event (e.g., `user.created`)
- `X-Allium-Delivery`: A unique UUID for this delivery attempt
- `X-Allium-Signature`: (If secret provided) HMAC-SHA256 signature of the payload

**Payload:**

```json
{
  "event": "user.created",
  "timestamp": "2023-10-27T10:00:00.000Z",
  "data": {
    "id": 1,
    "name": "Alice",
    "email": "alice@example.com"
  }
}
```

### 4. Verifying Signatures

If you set a `secret` for your webhook, you should verify the `X-Allium-Signature` header to ensure the request came from your Allium application.

The signature is a `sha256` HMAC of the raw request body.

**Node.js Example:**

```javascript
const crypto = require('crypto');

function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(JSON.stringify(payload));
  const calculated = `sha256=${hmac.digest('hex')}`;
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(calculated)
  );
}
```

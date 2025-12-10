# Webhooks

Allium comes with a built-in webhook system that allows your application to notify external systems about events.

## Overview

Webhooks are stored as **JSON files** in `.allium/webhooks/` directory, making them version-controlled and easy to deploy across environments.

The Webhook system consists of:

1. **JSON Configuration**: Webhook definitions stored in `.allium/webhooks/*.json`
2. **Webhook Service**: A service to trigger events and dispatch webhooks
3. **Admin API**: CRUD operations via `/_admin/webhooks`
4. **CLI Tool**: Generate webhooks with `allium generate webhook`

## Quick Start

### 1. Generate a Webhook

```bash
allium generate webhook
```

This creates a JSON file in `.allium/webhooks/`:

```json
{
  "name": "user-events",
  "url": "${WEBHOOK_USER_EVENTS_URL}",
  "events": ["user.created", "user.updated", "user.deleted"],
  "active": true,
  "secret": "${WEBHOOK_SECRET}"
}
```

### 2. Environment Variables

Set webhook URLs and secrets in your `.env`:

```bash
WEBHOOK_USER_EVENTS_URL=https://api.example.com/webhooks/users
WEBHOOK_SECRET=whsec_your_secret_key
```

Environment variables are interpolated at runtime using `${VAR_NAME}` syntax.

### 3. Trigger Events

```typescript
// Inside a route or service
fastify.post('/users', async (req, reply) => {
  const user = await fastify.prisma.user.create({ ... });

  // Trigger webhook event (fire-and-forget)
  fastify.webhooks.trigger('user.created', user);

  return user;
});
```


## JSON Structure Reference

### Complete Schema

```json
{
  "name": "string (required)",
  "url": "string (required)",
  "events": ["array of strings (required)"],
  "active": "boolean (required)",
  "secret": "string (optional)"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Unique identifier (lowercase, alphanumeric, hyphens only) |
| `url` | string | ✅ | Webhook endpoint URL or environment variable (`${VAR_NAME}`) |
| `events` | array | ✅ | Event names to subscribe to (e.g., `["user.created"]` or `["*"]` for all) |
| `active` | boolean | ✅ | Whether the webhook is enabled |
| `secret` | string | ❌ | Secret key for HMAC signature verification (optional) |

### Example Files

**Basic webhook:**
```json
{
  "name": "slack-notifications",
  "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "events": ["*"],
  "active": true
}
```

**With environment variables:**
```json
{
  "name": "user-events",
  "url": "${WEBHOOK_USER_EVENTS_URL}",
  "events": ["user.created", "user.updated", "user.deleted"],
  "active": true,
  "secret": "${WEBHOOK_SECRET}"
}
```

**Specific events:**
```json
{
  "name": "order-notifications",
  "url": "https://api.example.com/webhooks/orders",
  "events": ["order.created", "order.paid", "order.shipped"],
  "active": true
}
```


## Managing Webhooks

### Via CLI

```bash
# Generate new webhook
allium generate webhook

# Validate all webhooks
allium validate
```

### Via Admin API

All webhook routes are under `/_admin/webhooks`:

```bash
# List all webhooks
GET /_admin/webhooks

# Get specific webhook
GET /_admin/webhooks/:name

# Create webhook
POST /_admin/webhooks
{
  "name": "order-notifications",
  "url": "https://api.example.com/webhooks/orders",
  "events": ["order.created", "order.paid"],
  "active": true
}

# Update webhook
PUT /_admin/webhooks/:name

# Delete webhook
DELETE /_admin/webhooks/:name
```

> **Note**: Admin routes should be protected in production.

### Directly Editing JSON Files

You can also manually create/edit files in `.allium/webhooks/`:

```json
{
  "name": "slack-notifications",
  "url": "https://hooks.slack.com/services/YOUR/WEBHOOK/URL",
  "events": ["*"],
  "active": true
}
```

After editing, the webhook service automatically reloads on the next request or you can call:

```typescript
await fastify.webhooks.reload();
```

## Webhook Configuration

### Fields

- **name** (required): Unique identifier (lowercase, alphanumeric, hyphens)
- **url** (required): Endpoint URL or environment variable reference
- **events** (required): Array of event names or `["*"]` for all events
- **active** (required): Boolean to enable/disable
- **secret** (optional): Secret key for HMAC signature verification

### Event Names

Use dot notation for event names:

- `user.created`
- `user.updated`
- `user.deleted`
- `post.created`
- `order.paid`
- `*` (all events)

## Receiving Webhooks

Allium sends a `POST` request to the registered URL.

### Headers

- `Content-Type`: `application/json`
- `User-Agent`: `Allium-Webhook/1.0`
- `X-Allium-Event`: Event name (e.g., `user.created`)
- `X-Allium-Delivery`: Unique UUID for this delivery
- `X-Allium-Signature`: HMAC-SHA256 signature (if secret provided)

### Payload

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

## Security

### Verifying Signatures

If you set a `secret`, verify the `X-Allium-Signature` header:

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

## Environment Promotion

To deploy webhooks to a new environment:

1. **Copy configuration files:**

   ```bash
   cp -r .allium/webhooks /path/to/new/environment/.allium/
   ```

2. **Set environment variables:**

   ```bash
   # In new environment's .env
   WEBHOOK_USER_EVENTS_URL=https://staging.example.com/webhooks
   WEBHOOK_SECRET=staging_secret
   ```

3. **Deploy and restart** - webhooks load automatically

## Migration from Database

If you have existing database-stored webhooks:

1. **Export to JSON:**

   ```sql
   SELECT * FROM Webhook;
   ```

2. **Create JSON files** in `.allium/webhooks/` for each webhook

3. **Remove database table:**

   ```bash
   # Webhook model is no longer auto-injected
   allium db push
   ```

4. **Restart application** - webhooks now load from JSON files

# Simple Guide: Generate and Share API Keys

This is a **simple, practical guide** showing you exactly how to generate API keys and share them with other services.

---

## Step 1: Enable API Key Authentication

In your `src/app.ts`, add this configuration:

```typescript
import { initAllium } from '@allium/fastify';
import { User, Product, Facility } from './models';

const app = await initAllium({
  models: [User, Product, Facility],

  // Add this section
  apiKeyAuth: {
    enabled: true,
  },

  prisma: {
    datasourceUrl: process.env.DATABASE_URL || 'file:./dev.db',
    provider: 'sqlite',
  },
});

await app.listen({ port: 3000 });
```

Then sync and restart:

```bash
yarn allium sync
yarn allium db generate
yarn allium db push
yarn dev
```

---

## Step 2: Generate an API Key

### **For Development (Local Testing)**

Open a new terminal and run:

```bash
curl -X POST http://localhost:3000/api/apikey \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Payment Service",
    "service": "payment-service"
  }'
```

You'll get a response like:

```json
{
  "id": "abc-123-def",
  "name": "My Payment Service",
  "key": "sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6",
  "service": "payment-service",
  "isActive": true,
  "createdAt": "2025-11-30T..."
}
```

**⚠️ SAVE THE KEY!** You won't see it again. Copy the `key` value.

### **For Production**

Same command, but use your production URL:

```bash
curl -X POST https://api.yourcompany.com/api/apikey \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Payment Service - Production",
    "service": "payment-service"
  }'
```

---

## Step 3: Share the Key with the Other Service

You have **3 simple options**:

### **Option 1: Email (Quick & Simple)**

1. Copy the API key
2. Send an email to the service team:

```
Subject: API Key for Payment Service

Hi Team,

Here's the API key for accessing our API:

API URL: http://localhost:3000 (or https://api.yourcompany.com)
API Key: sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

Usage:
curl http://localhost:3000/api/user \
  -H "X-API-Key: sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"

Please store this securely in your environment variables.

Thanks!
```

### **Option 2: Slack/Teams (For Internal Teams)**

Send a direct message:

```
🔑 API Key for Payment Service

URL: http://localhost:3000
Key: sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

Add to your .env file:
ALLIUM_API_URL=http://localhost:3000
ALLIUM_API_KEY=sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### **Option 3: Shared Document (For Multiple Services)**

Create a Google Doc or Notion page:

| Service         | Environment | API Key        | Created    |
| --------------- | ----------- | -------------- | ---------- |
| Payment Service | Dev         | `sk_abc123...` | 2025-11-30 |
| Payment Service | Prod        | `sk_xyz789...` | 2025-11-30 |
| Analytics       | Dev         | `sk_def456...` | 2025-11-30 |

**⚠️ Important:** Share this document only with authorized people and delete it after everyone has saved their keys.

---

## Step 4: How the Other Service Uses the Key

Tell the other service team to do this:

### **In Their Code**

**Node.js/TypeScript:**

```typescript
// In their .env file
ALLIUM_API_URL=http://localhost:3000
ALLIUM_API_KEY=sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

// In their code
import axios from 'axios';

const api = axios.create({
  baseURL: process.env.ALLIUM_API_URL,
  headers: {
    'X-API-Key': process.env.ALLIUM_API_KEY,
  },
});

// Use it
const users = await api.get('/api/user');
console.log(users.data);
```

**Python:**

```python
# In their .env file
ALLIUM_API_URL=http://localhost:3000
ALLIUM_API_KEY=sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6

# In their code
import os
import requests

api_url = os.getenv('ALLIUM_API_URL')
api_key = os.getenv('ALLIUM_API_KEY')

response = requests.get(
    f'{api_url}/api/user',
    headers={'X-API-Key': api_key}
)

print(response.json())
```

**cURL (for testing):**

```bash
curl http://localhost:3000/api/user \
  -H "X-API-Key: sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
```

---

## Step 5: Test It

Have the other service test their integration:

```bash
# They run this
curl http://localhost:3000/api/user \
  -H "X-API-Key: sk_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6"
```

If it works, they'll see the user data. If not, they'll see:

```json
{
  "statusCode": 401,
  "error": "Unauthorized",
  "message": "Invalid API key"
}
```

---

## Real-World Example

### **Scenario: You have a Payment Service that needs to access your User API**

**Step 1:** Generate the key

```bash
curl -X POST http://localhost:3000/api/apikey \
  -H "Content-Type: application/json" \
  -d '{"name": "Payment Service", "service": "payment-service"}'
```

**Step 2:** You get back:

```json
{
  "key": "sk_abc123xyz789"
}
```

**Step 3:** Send to Payment Service team via Slack:

```
Hey @payment-team,

Here's your API key to access our User API:

URL: http://localhost:3000
Key: sk_abc123xyz789

Add these to your .env:
ALLIUM_API_URL=http://localhost:3000
ALLIUM_API_KEY=sk_abc123xyz789

Then use it like:
const users = await axios.get(
  `${process.env.ALLIUM_API_URL}/api/user`,
  { headers: { 'X-API-Key': process.env.ALLIUM_API_KEY } }
);
```

**Step 4:** Payment Service adds to their `.env`:

```bash
ALLIUM_API_URL=http://localhost:3000
ALLIUM_API_KEY=sk_abc123xyz789
```

**Step 5:** Payment Service uses it:

```typescript
// payment-service/src/users.ts
import axios from 'axios';

const alliumApi = axios.create({
  baseURL: process.env.ALLIUM_API_URL,
  headers: {
    'X-API-Key': process.env.ALLIUM_API_KEY,
  },
});

export async function getUserById(userId: string) {
  const response = await alliumApi.get(`/api/user/${userId}`);
  return response.data;
}
```

**Done!** ✅

---

## Multiple Environments (Dev, UAT, Production)

If you have multiple environments:

### **Development**

```bash
# Generate dev key
curl -X POST http://localhost:3000/api/apikey \
  -H "Content-Type: application/json" \
  -d '{"name": "Payment Service - Dev", "service": "payment-service"}'

# Share: sk_dev_abc123...
```

### **UAT**

```bash
# Generate UAT key
curl -X POST http://uat.yourcompany.com/api/apikey \
  -H "Content-Type: application/json" \
  -d '{"name": "Payment Service - UAT", "service": "payment-service"}'

# Share: sk_uat_def456...
```

### **Production**

```bash
# Generate production key
curl -X POST https://api.yourcompany.com/api/apikey \
  -H "Content-Type: application/json" \
  -d '{"name": "Payment Service - Production", "service": "payment-service"}'

# Share: sk_prod_xyz789...
```

Then the Payment Service has different keys in each environment:

**`.env.development`**

```bash
ALLIUM_API_URL=http://localhost:3000
ALLIUM_API_KEY=sk_dev_abc123...
```

**`.env.uat`**

```bash
ALLIUM_API_URL=http://uat.yourcompany.com
ALLIUM_API_KEY=sk_uat_def456...
```

**`.env.production`**

```bash
ALLIUM_API_URL=https://api.yourcompany.com
ALLIUM_API_KEY=sk_prod_xyz789...
```

---

## Managing Keys

### **List all keys:**

```bash
curl http://localhost:3000/api/apikey
```

### **Deactivate a key (if compromised):**

```bash
curl -X PATCH http://localhost:3000/api/apikey/{key-id} \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'
```

### **Delete a key:**

```bash
curl -X DELETE http://localhost:3000/api/apikey/{key-id}
```

---

## Quick Checklist

- [ ] Enable `apiKeyAuth` in your Allium config
- [ ] Restart your server
- [ ] Generate API key using `curl` command
- [ ] Copy the `key` value from the response
- [ ] Share the key with the other service (email/Slack/doc)
- [ ] Tell them to add it to their `.env` file
- [ ] Tell them to use it in the `X-API-Key` header
- [ ] Test that it works

---

## That's It!

It's really just:

1. **Generate** → Run `curl` command
2. **Share** → Send the key via email/Slack
3. **Use** → Other service adds to `.env` and uses in headers

No complex setup needed! 🚀

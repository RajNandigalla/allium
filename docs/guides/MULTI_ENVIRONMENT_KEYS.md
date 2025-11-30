# Managing API Keys Across Environments

This guide explains how to generate, manage, and securely share API keys across different environments (dev, UAT, production) and with different services.

## Overview

When working with multiple environments, you need:

1. **Separate databases** for each environment
2. **Environment-specific API keys** for each service
3. **Secure key distribution** to external services
4. **Key rotation strategy** for security

---

## 1. Environment Setup

### **Directory Structure**

```
my-allium-api/
├── .env.development
├── .env.uat
├── .env.production
├── prisma.config.js
└── src/
    └── app.ts
```

### **Environment Files**

Create separate `.env` files for each environment:

**`.env.development`**

```bash
NODE_ENV=development
DATABASE_URL="file:./dev.db"
DATABASE_PROVIDER=sqlite
PORT=3000
```

**`.env.uat`**

```bash
NODE_ENV=uat
DATABASE_URL="postgresql://user:pass@uat-db.example.com:5432/allium_uat"
DATABASE_PROVIDER=postgresql
PORT=3000
```

**`.env.production`**

```bash
NODE_ENV=production
DATABASE_URL="postgresql://user:pass@prod-db.example.com:5432/allium_prod"
DATABASE_PROVIDER=postgresql
PORT=3000
```

### **Load Environment Variables**

Install `dotenv`:

```bash
yarn add dotenv
```

Update your `src/app.ts`:

```typescript
import dotenv from 'dotenv';

// Load environment-specific config
const envFile = `.env.${process.env.NODE_ENV || 'development'}`;
dotenv.config({ path: envFile });

import { initAllium } from '@allium/fastify';
import { User, Product } from './models';

const app = await initAllium({
  models: [User, Product],

  apiKeyAuth: {
    enabled: true,
  },

  prisma: {
    datasourceUrl: process.env.DATABASE_URL!,
    provider: process.env.DATABASE_PROVIDER as any,
  },

  server: {
    logger: true,
  },
});

await app.listen({
  port: parseInt(process.env.PORT || '3000'),
  host: '0.0.0.0',
});
```

---

## 2. Generating API Keys for Each Environment

### **Development Environment**

```bash
# Start dev server
NODE_ENV=development yarn dev

# Generate API key for a service
curl -X POST http://localhost:3000/api/apikey \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Payment Service - Dev",
    "service": "payment-service"
  }'
```

### **UAT Environment**

```bash
# Start UAT server
NODE_ENV=uat yarn start

# Generate API key
curl -X POST http://uat.example.com/api/apikey \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Payment Service - UAT",
    "service": "payment-service"
  }'
```

### **Production Environment**

```bash
# Start production server
NODE_ENV=production yarn start

# Generate API key
curl -X POST https://api.example.com/api/apikey \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Payment Service - Production",
    "service": "payment-service"
  }'
```

---

## 3. Organizing Keys by Service and Environment

### **Recommended Naming Convention**

Use a consistent naming pattern:

```
{Service Name} - {Environment}
```

Examples:

- `Payment Service - Dev`
- `Payment Service - UAT`
- `Payment Service - Production`
- `Notification Service - Dev`
- `Analytics Service - Production`

### **Track Keys in a Spreadsheet (Internal Use Only)**

| Service         | Environment | Key ID | Created    | Expires    | Status |
| --------------- | ----------- | ------ | ---------- | ---------- | ------ |
| Payment Service | Dev         | abc123 | 2025-11-30 | Never      | Active |
| Payment Service | UAT         | def456 | 2025-11-30 | 2026-01-30 | Active |
| Payment Service | Prod        | ghi789 | 2025-11-30 | 2026-01-30 | Active |
| Notification    | Dev         | jkl012 | 2025-11-30 | Never      | Active |

**⚠️ NEVER store actual API keys in spreadsheets!** Only store metadata.

---

## 4. Securely Sharing API Keys with Services

### **Option 1: Secure Password Manager (Recommended)**

Use a password manager like:

- **1Password** (Teams/Business)
- **LastPass** (Enterprise)
- **Bitwarden** (Self-hosted option)
- **HashiCorp Vault** (Enterprise)

**Steps:**

1. Create a shared vault for each environment
2. Store API keys as secure notes
3. Share vault access with relevant team members
4. Revoke access when team members leave

### **Option 2: Encrypted Email**

For one-time sharing:

1. Generate the API key
2. Use PGP/GPG encryption
3. Send encrypted key via email
4. Share decryption key via separate channel (phone/Slack)

### **Option 3: Secrets Management Service**

For automated deployments:

**AWS Secrets Manager:**

```bash
# Store secret
aws secretsmanager create-secret \
  --name payment-service/api-key/production \
  --secret-string "sk_abc123..."

# Retrieve in application
const secret = await secretsManager.getSecretValue({
  SecretId: 'payment-service/api-key/production'
}).promise();
```

**Google Cloud Secret Manager:**

```bash
# Store secret
echo -n "sk_abc123..." | gcloud secrets create payment-api-key --data-file=-

# Access in application
const [version] = await client.accessSecretVersion({
  name: 'projects/my-project/secrets/payment-api-key/versions/latest',
});
```

**HashiCorp Vault:**

```bash
# Store secret
vault kv put secret/payment-service api-key="sk_abc123..."

# Retrieve in application
const secret = await vault.read('secret/payment-service');
```

---

## 5. Service Configuration

### **In External Services**

Each service should store the API key in its environment variables:

**Payment Service `.env.production`:**

```bash
ALLIUM_API_URL=https://api.example.com
ALLIUM_API_KEY=sk_abc123...
```

**Payment Service Code:**

```typescript
import axios from 'axios';

const alliumClient = axios.create({
  baseURL: process.env.ALLIUM_API_URL,
  headers: {
    'X-API-Key': process.env.ALLIUM_API_KEY,
  },
});

// Use the client
const users = await alliumClient.get('/api/user');
```

---

## 6. CLI Tool for Key Management

Create a helper script for managing keys across environments:

**`scripts/manage-keys.ts`**

```typescript
import axios from 'axios';
import dotenv from 'dotenv';

const environments = {
  dev: 'http://localhost:3000',
  uat: 'http://uat.example.com',
  prod: 'https://api.example.com',
};

async function createKey(env: keyof typeof environments, service: string) {
  const baseURL = environments[env];

  try {
    const response = await axios.post(`${baseURL}/api/apikey`, {
      name: `${service} - ${env.toUpperCase()}`,
      service: service,
      expiresAt:
        env === 'dev' ? null : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days for UAT/Prod
    });

    console.log(`\n✅ Created API key for ${service} in ${env.toUpperCase()}`);
    console.log(`Key: ${response.data.key}`);
    console.log(`ID: ${response.data.id}`);
    console.log(`\n⚠️  Save this key securely - it won't be shown again!`);

    return response.data;
  } catch (error) {
    console.error(`❌ Failed to create key: ${error.message}`);
  }
}

async function listKeys(env: keyof typeof environments) {
  const baseURL = environments[env];

  try {
    const response = await axios.get(`${baseURL}/api/apikey`);

    console.log(`\n📋 API Keys in ${env.toUpperCase()}:\n`);
    response.data.data.forEach((key: any) => {
      console.log(`- ${key.name}`);
      console.log(`  Service: ${key.service}`);
      console.log(`  Status: ${key.isActive ? '✅ Active' : '❌ Inactive'}`);
      console.log(`  Last Used: ${key.lastUsedAt || 'Never'}`);
      console.log(`  Expires: ${key.expiresAt || 'Never'}\n`);
    });
  } catch (error) {
    console.error(`❌ Failed to list keys: ${error.message}`);
  }
}

async function deactivateKey(env: keyof typeof environments, keyId: string) {
  const baseURL = environments[env];

  try {
    await axios.patch(`${baseURL}/api/apikey/${keyId}`, {
      isActive: false,
    });

    console.log(`✅ Deactivated key ${keyId} in ${env.toUpperCase()}`);
  } catch (error) {
    console.error(`❌ Failed to deactivate key: ${error.message}`);
  }
}

// CLI interface
const command = process.argv[2];
const env = process.argv[3] as keyof typeof environments;
const arg = process.argv[4];

switch (command) {
  case 'create':
    createKey(env, arg);
    break;
  case 'list':
    listKeys(env);
    break;
  case 'deactivate':
    deactivateKey(env, arg);
    break;
  default:
    console.log(`
Usage:
  ts-node scripts/manage-keys.ts create <env> <service>
  ts-node scripts/manage-keys.ts list <env>
  ts-node scripts/manage-keys.ts deactivate <env> <keyId>

Environments: dev, uat, prod
    `);
}
```

**Usage:**

```bash
# Create keys for all environments
ts-node scripts/manage-keys.ts create dev payment-service
ts-node scripts/manage-keys.ts create uat payment-service
ts-node scripts/manage-keys.ts create prod payment-service

# List keys
ts-node scripts/manage-keys.ts list prod

# Deactivate a key
ts-node scripts/manage-keys.ts deactivate prod abc123
```

---

## 7. Key Rotation Strategy

### **Automated Rotation (Recommended)**

Set expiration dates when creating keys:

```typescript
// 90-day expiration for production
const response = await axios.post('/api/apikey', {
  name: 'Payment Service - Production',
  service: 'payment-service',
  expiresAt: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
});
```

### **Rotation Process**

1. **30 days before expiration:**

   - Generate new API key
   - Share with service team
   - Update service configuration (but don't deploy yet)

2. **7 days before expiration:**

   - Deploy service with new key
   - Monitor for issues
   - Keep old key active

3. **After expiration:**
   - Old key automatically becomes invalid
   - Remove old key from service configuration

### **Emergency Rotation**

If a key is compromised:

```bash
# Immediately deactivate
curl -X PATCH https://api.example.com/api/apikey/{compromised-key-id} \
  -H "Content-Type: application/json" \
  -d '{"isActive": false}'

# Generate new key
curl -X POST https://api.example.com/api/apikey \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Payment Service - Production (Rotated)",
    "service": "payment-service"
  }'

# Share new key securely
# Update service immediately
```

---

## 8. Monitoring and Auditing

### **Track Key Usage**

Query the `lastUsedAt` field to detect:

- Unused keys (potential security risk)
- Compromised keys (unusual usage patterns)
- Services that need key updates

```bash
# List keys not used in 30 days
curl http://localhost:3000/api/apikey?filters[lastUsedAt][$lt]=2025-11-01
```

### **Set Up Alerts**

Monitor for:

- Keys expiring soon
- Inactive keys being used
- Failed authentication attempts
- Keys never used after creation

---

## 9. Best Practices

### **Security**

✅ Use different keys for each environment  
✅ Set expiration dates (90 days recommended)  
✅ Rotate keys regularly  
✅ Never commit keys to version control  
✅ Use secrets management services  
✅ Deactivate keys when services are decommissioned

### **Organization**

✅ Use consistent naming conventions  
✅ Document which service uses which key  
✅ Track key metadata (not actual keys)  
✅ Maintain a key rotation schedule

### **Distribution**

✅ Use encrypted channels  
✅ Verify recipient identity  
✅ Use password managers for team sharing  
✅ Revoke access when team members leave

---

## 10. Example: Complete Workflow

### **Scenario: Adding a new "Analytics Service"**

**Step 1: Generate keys for all environments**

```bash
ts-node scripts/manage-keys.ts create dev analytics-service
ts-node scripts/manage-keys.ts create uat analytics-service
ts-node scripts/manage-keys.ts create prod analytics-service
```

**Step 2: Store keys in secrets manager**

```bash
# Development
aws secretsmanager create-secret \
  --name analytics-service/api-key/dev \
  --secret-string "sk_dev_abc123..."

# UAT
aws secretsmanager create-secret \
  --name analytics-service/api-key/uat \
  --secret-string "sk_uat_def456..."

# Production
aws secretsmanager create-secret \
  --name analytics-service/api-key/prod \
  --secret-string "sk_prod_ghi789..."
```

**Step 3: Configure Analytics Service**

```typescript
// analytics-service/src/config.ts
import { SecretsManager } from 'aws-sdk';

const secretsManager = new SecretsManager();

export async function getConfig() {
  const env = process.env.NODE_ENV || 'development';

  const secret = await secretsManager
    .getSecretValue({
      SecretId: `analytics-service/api-key/${env}`,
    })
    .promise();

  return {
    alliumApiUrl: process.env.ALLIUM_API_URL,
    alliumApiKey: secret.SecretString,
  };
}
```

**Step 4: Use in Analytics Service**

```typescript
import axios from 'axios';
import { getConfig } from './config';

const config = await getConfig();

const alliumClient = axios.create({
  baseURL: config.alliumApiUrl,
  headers: {
    'X-API-Key': config.alliumApiKey,
  },
});

// Fetch data
const users = await alliumClient.get('/api/user');
```

**Step 5: Set up key rotation reminder**

```bash
# Add to calendar: Rotate analytics-service keys every 90 days
```

---

## Summary

- **Separate databases** for dev/UAT/prod
- **Environment-specific keys** for each service
- **Secure distribution** via password managers or secrets services
- **Regular rotation** (90 days recommended)
- **Monitoring** for unused or compromised keys
- **Automation** with CLI tools and scripts

For more details, see the [API Key Authentication Guide](./API_KEY_AUTH.md).

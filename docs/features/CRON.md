# Cron Jobs / Scheduled Tasks

Allium includes a built-in Cron Job scheduler that allows you to execute periodic tasks by calling your own API endpoints.

## Overview

Cron jobs are stored as **JSON files** in `.allium/cronjobs/` directory, making them version-controlled and easy to deploy across environments.

The Cron system consists of:

1. **JSON Configuration**: Cron job definitions stored in `.allium/cronjobs/*.json`
2. **Cron Service**: Schedules and executes jobs using `node-cron`
3. **Admin API**: CRUD operations via `/_admin/cronjobs`
4. **CLI Tool**: Generate cron jobs with `allium generate cronjob`

## Quick Start

### 1. Generate a Cron Job

```bash
allium generate cronjob
```

This creates a JSON file in `.allium/cronjobs/`:

```json
{
  "name": "daily-cleanup",
  "schedule": "0 2 * * *",
  "endpoint": "/api/tasks/cleanup",
  "method": "POST",
  "active": true
}
```

### 2. Create the Handler

Create an API route to handle the job execution:

```typescript
// src/routes/tasks.ts
fastify.post('/api/tasks/cleanup', async (req, reply) => {
  // Your cleanup logic here
  await fastify.prisma.log.deleteMany({
    where: {
      createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });

  return { success: true, message: 'Cleanup completed' };
});
```

### 3. Restart Application

The cron service automatically loads and schedules jobs on startup.


## JSON Structure Reference

### Complete Schema

```json
{
  "name": "string (required)",
  "schedule": "string (required)",
  "endpoint": "string (required)",
  "method": "string (required)",
  "active": "boolean (required)"
}
```

### Field Descriptions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | ✅ | Unique identifier (lowercase, alphanumeric, hyphens only) |
| `schedule` | string | ✅ | Cron expression (e.g., `"0 2 * * *"` for daily at 2 AM) |
| `endpoint` | string | ✅ | API endpoint to call (relative or absolute URL) |
| `method` | string | ✅ | HTTP method (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`) |
| `active` | boolean | ✅ | Whether the cron job is enabled |

### Example Files

**Daily cleanup:**
```json
{
  "name": "daily-cleanup",
  "schedule": "0 2 * * *",
  "endpoint": "/api/tasks/cleanup",
  "method": "POST",
  "active": true
}
```

**Hourly sync:**
```json
{
  "name": "hourly-sync",
  "schedule": "0 * * * *",
  "endpoint": "/api/tasks/sync",
  "method": "POST",
  "active": true
}
```

**Weekly report (Mondays at 9 AM):**
```json
{
  "name": "weekly-report",
  "schedule": "0 9 * * 1",
  "endpoint": "/api/reports/weekly",
  "method": "POST",
  "active": true
}
```

**External service (every 15 minutes):**
```json
{
  "name": "external-check",
  "schedule": "*/15 * * * *",
  "endpoint": "https://api.example.com/tasks/check",
  "method": "GET",
  "active": true
}
```


## Managing Cron Jobs

### Via CLI

```bash
# Generate new cron job
allium generate cronjob

# Validate all cron jobs
allium validate
```

### Via Admin API

All cron job routes are under `/_admin/cronjobs`:

```bash
# List all cron jobs
GET /_admin/cronjobs

# Get specific cron job
GET /_admin/cronjobs/:name

# Create cron job
POST /_admin/cronjobs
{
  "name": "hourly-sync",
  "schedule": "0 * * * *",
  "endpoint": "/api/tasks/sync",
  "method": "POST",
  "active": true
}

# Update cron job
PUT /_admin/cronjobs/:name

# Delete cron job
DELETE /_admin/cronjobs/:name
```

> **Note**: Admin routes should be protected in production.

### Directly Editing JSON Files

You can manually create/edit files in `.allium/cronjobs/`:

```json
{
  "name": "weekly-report",
  "schedule": "0 9 * * 1",
  "endpoint": "/api/reports/weekly",
  "method": "POST",
  "active": true
}
```

After editing, reload the cron service:

```typescript
await fastify.cron.reload();
```

## Cron Job Configuration

### Fields

- **name** (required): Unique identifier (lowercase, alphanumeric, hyphens)
- **schedule** (required): Cron expression (validated)
- **endpoint** (required): API endpoint to call (relative or absolute URL)
- **method** (required): HTTP method (GET, POST, PUT, PATCH, DELETE)
- **active** (required): Boolean to enable/disable

### Cron Expression Format

Standard cron syntax: `minute hour day month weekday`

Examples:

- `0 2 * * *` - Daily at 2:00 AM
- `0 * * * *` - Every hour
- `*/15 * * * *` - Every 15 minutes
- `0 9 * * 1` - Every Monday at 9:00 AM
- `0 0 1 * *` - First day of every month at midnight

### Endpoint URLs

**Relative paths** (default to localhost):

```json
{
  "endpoint": "/api/tasks/cleanup"
}
```

Calls: `http://localhost:3000/api/tasks/cleanup`

**Absolute URLs** (external services):

```json
{
  "endpoint": "https://api.example.com/tasks/sync"
}
```

## Security

When the cron scheduler calls your endpoint, it includes identification headers:

### Headers

- `User-Agent`: `Allium-Cron/1.0`
- `X-Allium-Job`: The name of the cron job (e.g., `daily-cleanup`)

### Security Best Practices

1. **Verify headers:**

   ```typescript
   fastify.post('/api/tasks/cleanup', async (req, reply) => {
     if (req.headers['user-agent'] !== 'Allium-Cron/1.0') {
       return reply.code(403).send({ error: 'Forbidden' });
     }
     // Your logic...
   });
   ```

2. **Use shared secrets:**

   ```json
   {
     "endpoint": "/api/tasks/cleanup?token=SECRET_TOKEN"
   }
   ```

3. **Localhost-only routes:**
   ```typescript
   fastify.post(
     '/api/tasks/cleanup',
     {
       config: {
         rateLimit: false, // Disable rate limiting for cron jobs
       },
     },
     async (req, reply) => {
       // Only allow from localhost
       const ip = req.ip;
       if (ip !== '127.0.0.1' && ip !== '::1') {
         return reply.code(403).send({ error: 'Forbidden' });
       }
       // Your logic...
     }
   );
   ```

## Programmatic Access

Access the cron service directly if needed:

```typescript
// Reload all jobs from JSON files
await fastify.cron.reload();

// Stop all jobs
fastify.cron.stop();

// Restart (stop + reload)
await fastify.cron.start();
```

## Environment Promotion

To deploy cron jobs to a new environment:

1. **Copy configuration files:**

   ```bash
   cp -r .allium/cronjobs /path/to/new/environment/.allium/
   ```

2. **Adjust schedules if needed** (e.g., less frequent in staging)

3. **Deploy and restart** - cron jobs load automatically

## Common Use Cases

### Daily Cleanup

```json
{
  "name": "daily-cleanup",
  "schedule": "0 2 * * *",
  "endpoint": "/api/tasks/cleanup",
  "method": "POST",
  "active": true
}
```

### Hourly Data Sync

```json
{
  "name": "hourly-sync",
  "schedule": "0 * * * *",
  "endpoint": "/api/tasks/sync",
  "method": "POST",
  "active": true
}
```

### Weekly Reports

```json
{
  "name": "weekly-report",
  "schedule": "0 9 * * 1",
  "endpoint": "/api/reports/weekly",
  "method": "POST",
  "active": true
}
```

### Every 15 Minutes

```json
{
  "name": "frequent-check",
  "schedule": "*/15 * * * *",
  "endpoint": "/api/tasks/check",
  "method": "GET",
  "active": true
}
```

## Migration from Database

If you have existing database-stored cron jobs:

1. **Export to JSON:**

   ```sql
   SELECT * FROM CronJob;
   ```

2. **Create JSON files** in `.allium/cronjobs/` for each job

3. **Remove database table:**

   ```bash
   # CronJob model is no longer auto-injected
   allium db push
   ```

4. **Restart application** - cron jobs now load from JSON files

## Troubleshooting

### Job Not Running

1. Check if job is active: `GET /_admin/cronjobs/:name`
2. Verify cron expression: Use [crontab.guru](https://crontab.guru)
3. Check logs for errors
4. Ensure endpoint is accessible

### Reload Jobs

If you edit JSON files manually:

```typescript
await fastify.cron.reload();
```

Or restart the application.

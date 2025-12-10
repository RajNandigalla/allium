# Cron Jobs / Scheduled Tasks

Allium includes a built-in Cron Job scheduler that allows you to execute periodic tasks by calling your own API endpoints.

## Overview

The Cron system is designed to be:

- **Database-backed**: Jobs are defined in the database, allowing dynamic management via Admin Panel.
- **Distributed-friendly**: Jobs trigger HTTP endpoints, so the actual logic can reside on any server (though the scheduler currently runs on the main instance).

## Usage

### 1. Defining a Cron Job

You can manage cron jobs via the Admin Panel, the API, or programmatically using Prisma.

#### Option A: Admin Panel / API

`POST /_admin/cronjob`

> **Note**: Cron job routes are under `/_admin` for security. These routes should be protected in production.

#### Option B: Programmatic (Prisma)

Ideal for seeding default jobs for your application.

> **Note**: Ensure you have run `allium sync` and `allium db push` so that the `CronJob` table and types exist.

```typescript
// Example: Registering a cron job on startup in src/app.ts
const app = await initAllium({ ... });

await app.ready();

await app.prisma.cronJob.upsert({
  where: { name: 'daily-cleanup' },
  update: { schedule: '0 0 * * *' },
  create: {
    name: 'daily-cleanup',
    schedule: '0 0 * * *',
    endpoint: '/api/tasks/cleanup',
    active: true
  }
});
```

**Fields:**

- `name` (String, required): Unique name for the job.
- `schedule` (String, required): Standard cron expression (e.g., `0 0 * * *` for daily at midnight).
- `endpoint` (String, required): The internal or external URL to call.
  - Can be a full URL: `https://api.example.com/tasks/daily-report`
  - Can be a relative path: `/api/tasks/cleanup` (defaults to localhost)
- `method` (String): HTTP method (`POST`, `GET`, etc.). Defaults to `POST`.
- `active` (Boolean): Enable/disable the job.

### 2. Creating the Handler

Create a regular API route to handle the job execution. This route should contain the business logic you want to run.

```typescript
// src/routes/tasks.ts
fastify.post('/api/tasks/cleanup', async (req, reply) => {
  // Your logic here
  await fastify.prisma.log.deleteMany({
    where: {
      createdAt: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
    },
  });

  return { success: true };
});
```

### 3. Security

When the cron scheduler calls your endpoint, it includes a special header for identification.

**Headers:**

- `User-Agent`: `Allium-Cron/1.0`
- `X-Allium-Job`: The name of the cron job (e.g., `daily-cleanup`)

> **Security Tip**: For sensitive tasks, verify this header or use a shared secret in the endpoint URL (e.g., `/api/tasks/cleanup?token=SECRET`) or configure the route to accept calls only from localhost.

### 4. Direct Access

You can access the `cron` service directly if needed (e.g., to programmatically reload jobs after modification).

```typescript
// Reload all jobs from the database
await fastify.cron.reload();
```

Note: The `CronService` automatically reloads jobs on startup.

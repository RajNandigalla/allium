import { FastifyInstance } from 'fastify';
import path from 'path';
import fs from 'fs-extra';
import { CronJobValidator } from '@allium/core';
import cron from 'node-cron';

export async function registerCronJobsRoutes(fastify: FastifyInstance) {
  const cronjobsDir = path.join(process.cwd(), '.allium', 'cronjobs');
  const validator = new CronJobValidator();

  // GET /_admin/cronjobs
  fastify.get(
    '/cronjobs',
    {
      schema: {
        tags: ['Admin - Cron Jobs'],
        description: 'List all cron jobs',
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                schedule: { type: 'string' },
                endpoint: { type: 'string' },
                method: { type: 'string' },
                active: { type: 'boolean' },
              },
            },
          },
        },
      },
    },
    async () => {
      if (!(await fs.pathExists(cronjobsDir))) {
        return [];
      }

      const files = await fs.readdir(cronjobsDir);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));

      const cronjobs = await Promise.all(
        jsonFiles.map((file) => fs.readJson(path.join(cronjobsDir, file)))
      );

      return cronjobs;
    }
  );

  // GET /_admin/cronjobs/:name
  fastify.get<{ Params: { name: string } }>(
    '/cronjobs/:name',
    {
      schema: {
        tags: ['Admin - Cron Jobs'],
        description: 'Get a specific cron job',
        params: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const filePath = path.join(cronjobsDir, `${request.params.name}.json`);

      if (!(await fs.pathExists(filePath))) {
        return reply.code(404).send({ error: 'Cron job not found' });
      }

      const cronjob = await fs.readJson(filePath);
      return cronjob;
    }
  );

  // POST /_admin/cronjobs
  fastify.post<{ Body: any }>(
    '/cronjobs',
    {
      schema: {
        tags: ['Admin - Cron Jobs'],
        description: 'Create a new cron job',
        body: {
          type: 'object',
          required: ['name', 'schedule', 'endpoint', 'method', 'active'],
          properties: {
            name: { type: 'string' },
            schedule: { type: 'string' },
            endpoint: { type: 'string' },
            method: {
              type: 'string',
              enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            },
            active: { type: 'boolean' },
          },
        },
      },
    },
    async (request, reply) => {
      const cronjob = request.body;

      // Validate
      const validation = validator.validate(cronjob);
      if (!validation.valid) {
        return reply
          .code(400)
          .send({ error: 'Validation failed', errors: validation.errors });
      }

      // Validate cron expression
      if (!cron.validate(cronjob.schedule)) {
        return reply.code(400).send({ error: 'Invalid cron expression' });
      }

      // Check if exists
      const filePath = path.join(cronjobsDir, `${cronjob.name}.json`);
      if (await fs.pathExists(filePath)) {
        return reply.code(409).send({ error: 'Cron job already exists' });
      }

      // Create directory if needed
      await fs.ensureDir(cronjobsDir);

      // Write file
      await fs.writeJson(filePath, cronjob, { spaces: 2 });

      // Reload cron jobs
      await fastify.cron.reload();

      return { success: true, cronjob };
    }
  );

  // PUT /_admin/cronjobs/:name
  fastify.put<{ Params: { name: string }; Body: any }>(
    '/cronjobs/:name',
    {
      schema: {
        tags: ['Admin - Cron Jobs'],
        description: 'Update a cron job',
        params: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['name', 'schedule', 'endpoint', 'method', 'active'],
          properties: {
            name: { type: 'string' },
            schedule: { type: 'string' },
            endpoint: { type: 'string' },
            method: {
              type: 'string',
              enum: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
            },
            active: { type: 'boolean' },
          },
        },
      },
    },
    async (request, reply) => {
      const oldName = request.params.name;
      const cronjob = request.body;
      const oldPath = path.join(cronjobsDir, `${oldName}.json`);

      if (!(await fs.pathExists(oldPath))) {
        return reply.code(404).send({ error: 'Cron job not found' });
      }

      // Validate
      const validation = validator.validate(cronjob);
      if (!validation.valid) {
        return reply
          .code(400)
          .send({ error: 'Validation failed', errors: validation.errors });
      }

      // Validate cron expression
      if (!cron.validate(cronjob.schedule)) {
        return reply.code(400).send({ error: 'Invalid cron expression' });
      }

      // If name changed, delete old file
      if (oldName !== cronjob.name) {
        await fs.remove(oldPath);
      }

      // Write new/updated file
      const newPath = path.join(cronjobsDir, `${cronjob.name}.json`);
      await fs.writeJson(newPath, cronjob, { spaces: 2 });

      // Reload cron jobs
      await fastify.cron.reload();

      return { success: true, cronjob };
    }
  );

  // DELETE /_admin/cronjobs/:name
  fastify.delete<{ Params: { name: string } }>(
    '/cronjobs/:name',
    {
      schema: {
        tags: ['Admin - Cron Jobs'],
        description: 'Delete a cron job',
        params: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const filePath = path.join(cronjobsDir, `${request.params.name}.json`);

      if (!(await fs.pathExists(filePath))) {
        return reply.code(404).send({ error: 'Cron job not found' });
      }

      await fs.remove(filePath);

      // Reload cron jobs
      await fastify.cron.reload();

      return { success: true };
    }
  );
}

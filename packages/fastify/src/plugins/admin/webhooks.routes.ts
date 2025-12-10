import { FastifyInstance } from 'fastify';
import path from 'path';
import fs from 'fs-extra';
import { WebhookValidator } from '@allium/core';

export async function registerWebhooksRoutes(fastify: FastifyInstance) {
  const webhooksDir = path.join(process.cwd(), '.allium', 'webhooks');
  const validator = new WebhookValidator();

  // GET /_admin/webhooks
  fastify.get(
    '/webhooks',
    {
      schema: {
        tags: ['Admin - Webhooks'],
        description: 'List all webhooks',
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                url: { type: 'string' },
                events: { type: 'array', items: { type: 'string' } },
                active: { type: 'boolean' },
                secret: { type: 'string' },
              },
            },
          },
        },
      },
    },
    async () => {
      if (!(await fs.pathExists(webhooksDir))) {
        return [];
      }

      const files = await fs.readdir(webhooksDir);
      const jsonFiles = files.filter((f) => f.endsWith('.json'));

      const webhooks = await Promise.all(
        jsonFiles.map((file) => fs.readJson(path.join(webhooksDir, file)))
      );

      return webhooks;
    }
  );

  // GET /_admin/webhooks/:name
  fastify.get<{ Params: { name: string } }>(
    '/webhooks/:name',
    {
      schema: {
        tags: ['Admin - Webhooks'],
        description: 'Get a specific webhook',
        params: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const filePath = path.join(webhooksDir, `${request.params.name}.json`);

      if (!(await fs.pathExists(filePath))) {
        return reply.code(404).send({ error: 'Webhook not found' });
      }

      const webhook = await fs.readJson(filePath);
      return webhook;
    }
  );

  // POST /_admin/webhooks
  fastify.post<{ Body: any }>(
    '/webhooks',
    {
      schema: {
        tags: ['Admin - Webhooks'],
        description: 'Create a new webhook',
        body: {
          type: 'object',
          required: ['name', 'url', 'events', 'active'],
          properties: {
            name: { type: 'string' },
            url: { type: 'string' },
            events: { type: 'array', items: { type: 'string' } },
            active: { type: 'boolean' },
            secret: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const webhook = request.body;

      // Validate
      const validation = validator.validate(webhook);
      if (!validation.valid) {
        return reply
          .code(400)
          .send({ error: 'Validation failed', errors: validation.errors });
      }

      // Check if exists
      const filePath = path.join(webhooksDir, `${webhook.name}.json`);
      if (await fs.pathExists(filePath)) {
        return reply.code(409).send({ error: 'Webhook already exists' });
      }

      // Create directory if needed
      await fs.ensureDir(webhooksDir);

      // Write file
      await fs.writeJson(filePath, webhook, { spaces: 2 });

      // Reload webhooks
      await fastify.webhooks.reload();

      return { success: true, webhook };
    }
  );

  // PUT /_admin/webhooks/:name
  fastify.put<{ Params: { name: string }; Body: any }>(
    '/webhooks/:name',
    {
      schema: {
        tags: ['Admin - Webhooks'],
        description: 'Update a webhook',
        params: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        body: {
          type: 'object',
          required: ['name', 'url', 'events', 'active'],
          properties: {
            name: { type: 'string' },
            url: { type: 'string' },
            events: { type: 'array', items: { type: 'string' } },
            active: { type: 'boolean' },
            secret: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const oldName = request.params.name;
      const webhook = request.body;
      const oldPath = path.join(webhooksDir, `${oldName}.json`);

      if (!(await fs.pathExists(oldPath))) {
        return reply.code(404).send({ error: 'Webhook not found' });
      }

      // Validate
      const validation = validator.validate(webhook);
      if (!validation.valid) {
        return reply
          .code(400)
          .send({ error: 'Validation failed', errors: validation.errors });
      }

      // If name changed, delete old file
      if (oldName !== webhook.name) {
        await fs.remove(oldPath);
      }

      // Write new/updated file
      const newPath = path.join(webhooksDir, `${webhook.name}.json`);
      await fs.writeJson(newPath, webhook, { spaces: 2 });

      // Reload webhooks
      await fastify.webhooks.reload();

      return { success: true, webhook };
    }
  );

  // DELETE /_admin/webhooks/:name
  fastify.delete<{ Params: { name: string } }>(
    '/webhooks/:name',
    {
      schema: {
        tags: ['Admin - Webhooks'],
        description: 'Delete a webhook',
        params: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      },
    },
    async (request, reply) => {
      const filePath = path.join(webhooksDir, `${request.params.name}.json`);

      if (!(await fs.pathExists(filePath))) {
        return reply.code(404).send({ error: 'Webhook not found' });
      }

      await fs.remove(filePath);

      // Reload webhooks
      await fastify.webhooks.reload();

      return { success: true };
    }
  );
}

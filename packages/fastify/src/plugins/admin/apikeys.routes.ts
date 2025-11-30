import { FastifyInstance } from 'fastify';
import { generateApiKey } from '@allium/core';

export async function registerApiKeysRoutes(fastify: FastifyInstance) {
  // GET /_admin/api-keys
  fastify.get(
    '/api-keys',
    {
      schema: {
        tags: ['Admin - API Keys'],
        description: 'List all API keys',
        response: {
          200: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                service: { type: 'string' },
                key: { type: 'string' }, // We want to show the key to admins
                isActive: { type: 'boolean' },
                lastUsedAt: { type: 'string', format: 'date-time' },
                createdAt: { type: 'string', format: 'date-time' },
              },
            },
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
          },
        },
      },
    },
    async (req, reply) => {
      // Check if ApiKey model exists in Prisma
      if (!fastify.prisma.apiKey) {
        return reply
          .code(404)
          .send({ error: 'ApiKey model not found in database' });
      }

      const keys = await fastify.prisma.apiKey.findMany({
        orderBy: { createdAt: 'desc' },
      });
      return keys;
    }
  );

  // POST /_admin/api-keys
  fastify.post<{ Body: { name: string; service: string; expiresAt?: string } }>(
    '/api-keys',
    {
      schema: {
        tags: ['Admin - API Keys'],
        description: 'Generate a new API key',
        body: {
          type: 'object',
          required: ['name', 'service'],
          properties: {
            name: { type: 'string' },
            service: { type: 'string' },
            expiresAt: { type: 'string', format: 'date-time' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              apiKey: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  service: { type: 'string' },
                  key: { type: 'string' },
                  isActive: { type: 'boolean' },
                },
              },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { name, service, expiresAt } = req.body;

      if (!fastify.prisma.apiKey) {
        return reply
          .code(404)
          .send({ error: 'ApiKey model not found in database' });
      }

      // Generate key manually to ensure we return it (hooks might hide it depending on implementation)
      // Although the model hook does generate it, we want to be explicit here.
      // Actually, let's rely on the model hook or the helper if available.
      // The model hook uses `generateApiKey` from core.
      // But we are using Prisma directly here, so the Allium model hooks (which run in the API layer) might NOT run if we use `fastify.prisma.apiKey.create`.
      // Prisma middleware might handle it if configured, but Allium hooks are usually at the service/controller layer.
      // So we should generate it here.

      const key = generateApiKey();

      const apiKey = await fastify.prisma.apiKey.create({
        data: {
          name,
          service,
          key,
          expiresAt: expiresAt ? new Date(expiresAt) : null,
          isActive: true,
        },
      });

      return { success: true, apiKey };
    }
  );

  // DELETE /_admin/api-keys/:id
  fastify.delete<{ Params: { id: string } }>(
    '/api-keys/:id',
    {
      schema: {
        tags: ['Admin - API Keys'],
        description: 'Revoke (delete) an API key',
        params: {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          required: ['id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { id } = req.params;

      if (!fastify.prisma.apiKey) {
        return reply
          .code(404)
          .send({ error: 'ApiKey model not found in database' });
      }

      await fastify.prisma.apiKey.delete({
        where: { id },
      });

      return { success: true, message: 'API key revoked' };
    }
  );
}

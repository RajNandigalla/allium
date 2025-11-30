import { FastifyInstance } from 'fastify';
import path from 'path';
import fs from 'fs-extra';

export async function registerConfigRoutes(
  fastify: FastifyInstance,
  projectRoot: string
) {
  // GET /_admin/config
  fastify.get(
    '/config',
    {
      schema: {
        tags: ['Admin - Config'],
        description: 'Get project configuration',
        response: {
          200: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              version: { type: 'string' },
              root: { type: 'string' },
            },
          },
        },
      },
    },
    async () => {
      const pkg = await fs
        .readJson(path.join(projectRoot, 'package.json'))
        .catch(() => ({}));
      return {
        name: pkg.name,
        version: pkg.version,
        root: projectRoot,
      };
    }
  );

  // GET /_admin/types
  fastify.get(
    '/types',
    {
      schema: {
        tags: ['Admin - Config'],
        description: 'List available data types',
        response: {
          200: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    },
    async () => {
      return ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json'];
    }
  );

  // GET /_admin/relationships
  fastify.get(
    '/relationships',
    {
      schema: {
        tags: ['Admin - Config'],
        description: 'List available relationship types',
        response: {
          200: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    },
    async () => {
      return ['1:1', '1:n', 'n:m', 'polymorphic'];
    }
  );

  // GET /_admin/field-options
  fastify.get(
    '/field-options',
    {
      schema: {
        tags: ['Admin - Config'],
        description: 'Get available field options',
        response: {
          200: {
            type: 'object',
            properties: {
              options: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    type: { type: 'string' },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async () => {
      return {
        options: [
          {
            name: 'required',
            type: 'boolean',
            description: 'Field is required',
          },
          {
            name: 'unique',
            type: 'boolean',
            description: 'Field must be unique',
          },
          {
            name: 'default',
            type: 'any',
            description: 'Default value for the field',
          },
          {
            name: 'readPrivate',
            type: 'boolean',
            description: 'Hide field in read operations',
          },
          {
            name: 'writePrivate',
            type: 'boolean',
            description: 'Prevent field from being written by users',
          },
        ],
      };
    }
  );

  // GET /_admin/validation-rules
  fastify.get(
    '/validation-rules',
    {
      schema: {
        tags: ['Admin - Config'],
        description: 'Get available validation rules',
        response: {
          200: {
            type: 'object',
            properties: {
              rules: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    applicableTypes: {
                      type: 'array',
                      items: { type: 'string' },
                    },
                    description: { type: 'string' },
                  },
                },
              },
            },
          },
        },
      },
    },
    async () => {
      return {
        rules: [
          {
            name: 'min',
            applicableTypes: ['Int', 'Float', 'String'],
            description: 'Minimum value/length',
          },
          {
            name: 'max',
            applicableTypes: ['Int', 'Float', 'String'],
            description: 'Maximum value/length',
          },
          {
            name: 'email',
            applicableTypes: ['String'],
            description: 'Valid email format',
          },
          {
            name: 'url',
            applicableTypes: ['String'],
            description: 'Valid URL format',
          },
          {
            name: 'regex',
            applicableTypes: ['String'],
            description: 'Custom regex pattern',
          },
        ],
      };
    }
  );
}

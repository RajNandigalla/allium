import { FastifyInstance } from 'fastify';
import path from 'path';
import fs from 'fs-extra';

// Type definitions
interface FieldDefinition {
  name: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  default?: any;
}

interface RelationDefinition {
  name: string;
  type: string;
  model: string;
  foreignKey?: string;
}

interface ModelDefinition {
  name: string;
  fields?: FieldDefinition[];
  relations?: RelationDefinition[];
}

interface Schema {
  models: ModelDefinition[];
}

// Strapi-style filter operators
type FilterOperator =
  | '$eq'
  | '$ne'
  | '$gt'
  | '$gte'
  | '$lt'
  | '$lte'
  | '$contains'
  | '$startsWith'
  | '$endsWith'
  | '$in'
  | '$notIn';

// Type for filter query parameters
// Supports patterns like: filters[fieldName][$operator]=value
type FilterParam =
  | `filters[${string}][${FilterOperator}]`
  | `filters[${string}]`;

interface FilterQueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

// Extend FilterQueryParams to include dynamic filter parameters
// This allows filters[field][$op]=value while maintaining type safety
type QueryParamsWithFilters = FilterQueryParams & {
  [K in FilterParam]?: string | number | boolean;
};

export async function registerDataRoutes(
  fastify: FastifyInstance,
  alliumDir: string
) {
  // Load schema for relation info
  const schemaPath = path.join(alliumDir, 'schema.json');
  let schema: Schema = { models: [] };

  try {
    if (await fs.pathExists(schemaPath)) {
      schema = await fs.readJson(schemaPath);
    }
  } catch (e) {
    fastify.log.warn('Failed to load schema.json for data routes');
  }

  // Helper to get Prisma model delegate safely
  const getModel = (modelName: string) => {
    // Try camelCase first (standard Prisma)
    const camelCase = modelName.charAt(0).toLowerCase() + modelName.slice(1);
    const client = fastify.prisma as any;
    if (client[camelCase]) return client[camelCase];

    // Try PascalCase (sometimes used)
    if (client[modelName]) return client[modelName];

    // Try lowercase
    if (client[modelName.toLowerCase()]) return client[modelName.toLowerCase()];

    return null;
  };

  // Helper to get model definition from schema
  const getModelDef = (modelName: string): ModelDefinition | undefined => {
    return schema.models.find(
      (m) => m.name.toLowerCase() === modelName.toLowerCase()
    );
  };

  // Helper to transform data for Prisma (handle relations)
  const transformData = (modelName: string, data: any) => {
    const modelDef = getModelDef(modelName);
    if (!modelDef) return data;

    const transformed = { ...data };

    // Handle relations
    if (modelDef.relations) {
      for (const relation of modelDef.relations) {
        const fieldName = relation.name;
        const value = data[fieldName];

        // If value is present and is a string/number (ID), convert to connect
        if (value !== undefined && value !== null) {
          // Check if it's a primitive (ID) rather than an object
          if (typeof value !== 'object') {
            // For 1:1 or n:1, we connect
            transformed[fieldName] = {
              connect: { id: value },
            };
          } else if (Array.isArray(value)) {
            // For 1:n or n:m, if array of strings/numbers, connect multiple
            const isArrayOfPrimitives = value.every(
              (v: any) => typeof v !== 'object'
            );
            if (isArrayOfPrimitives) {
              transformed[fieldName] = {
                connect: value.map((id: any) => ({ id })),
              };
            }
          }
        }
      }
    }

    return transformed;
  };

  // GET /_admin/data/:model - List records
  fastify.get<{
    Params: { model: string };
    Querystring: QueryParamsWithFilters;
  }>(
    '/data/:model',
    {
      schema: {
        tags: ['Admin - Data Explorer'],
        description: `List records for a model with pagination, sorting, and filtering (Strapi-style).

**Filter Syntax:**
Use query parameters in the format: \`filters[fieldName][$operator]=value\`

**Supported Operators:**
- \`$eq\` - Equals (exact match)
- \`$ne\` - Not equals
- \`$gt\` - Greater than
- \`$gte\` - Greater than or equal
- \`$lt\` - Less than
- \`$lte\` - Less than or equal
- \`$contains\` - Contains (case-insensitive)
- \`$startsWith\` - Starts with (case-insensitive)
- \`$endsWith\` - Ends with (case-insensitive)
- \`$in\` - In array (comma-separated values)
- \`$notIn\` - Not in array (comma-separated values)

**Examples:**
- \`?filters[name][$eq]=John Doe\` - Exact name match
- \`?filters[email][$contains]=@example.com\` - Email contains
- \`?filters[age][$gte]=18&filters[age][$lte]=65\` - Age range
- \`?filters[status][$eq]=active&filters[role][$in]=admin,user\` - Multiple filters`,
        params: {
          type: 'object',
          properties: {
            model: { type: 'string', description: 'Model name' },
          },
          required: ['model'],
        },
        querystring: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              default: 1,
              description: 'Page number for pagination',
            },
            limit: {
              type: 'integer',
              default: 10,
              description: 'Number of records per page',
            },
            sort: {
              type: 'string',
              default: 'createdAt',
              description: 'Field to sort by',
            },
            order: {
              type: 'string',
              enum: ['asc', 'desc'],
              default: 'desc',
              description: 'Sort order',
            },
          },
          // Allow arbitrary filter parameters
          additionalProperties: true,
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  additionalProperties: true,
                },
              },
              meta: {
                type: 'object',
                properties: {
                  total: { type: 'integer' },
                  page: { type: 'integer' },
                  limit: { type: 'integer' },
                  pages: { type: 'integer' },
                },
              },
            },
            description: 'Successfully retrieved records',
          },
          404: {
            type: 'object',
            properties: {
              error: { type: 'string' },
            },
            description: 'Model not found',
          },
        },
      },
    },
    async (req, reply) => {
      const { model } = req.params;
      const params = req.query;
      const {
        page = 1,
        limit = 10,
        sort = 'createdAt',
        order = 'desc',
      } = params;

      const prismaModel = getModel(model);
      if (!prismaModel) {
        return reply
          .code(404)
          .send({ error: `Model '${model}' not found in database` });
      }

      const skip = (page - 1) * limit;
      const orderBy = { [sort]: order };

      // Build where clause from Strapi-style filters
      // Format: filters[field][$op]=value
      const filterKeys = Object.keys(params).filter((k) =>
        k.startsWith('filters')
      );
      const where: Record<string, any> = {};

      const modelDef = getModelDef(model);

      for (const key of filterKeys) {
        // Match filters[field][$op]
        const match = key.match(/^filters\[(\w+)\]\[(\$\w+)\]$/);
        if (match) {
          const [, field, op] = match;
          const value = (params as Record<string, any>)[key];

          if (!where[field]) where[field] = {};

          // Helper to convert type based on model definition
          const convertType = (val: any) => {
            const fieldDef = modelDef?.fields?.find(
              (f: FieldDefinition) => f.name === field
            );
            if (!fieldDef) return val;
            if (fieldDef.type === 'Int') return Number(val);
            if (fieldDef.type === 'Boolean') return val === 'true';
            if (fieldDef.type === 'DateTime') return new Date(val);
            return val;
          };

          const typedValue = convertType(value);

          switch (op) {
            case '$eq':
              where[field] = typedValue;
              break;
            case '$ne':
              where[field].not = typedValue;
              break;
            case '$gt':
              where[field].gt = typedValue;
              break;
            case '$gte':
              where[field].gte = typedValue;
              break;
            case '$lt':
              where[field].lt = typedValue;
              break;
            case '$lte':
              where[field].lte = typedValue;
              break;
            case '$contains':
              where[field].contains = String(value);
              where[field].mode = 'insensitive';
              break;
            case '$startsWith':
              where[field].startsWith = String(value);
              where[field].mode = 'insensitive';
              break;
            case '$endsWith':
              where[field].endsWith = String(value);
              where[field].mode = 'insensitive';
              break;
            case '$in':
              where[field].in = Array.isArray(value)
                ? value.map(convertType)
                : String(value).split(',').map(convertType);
              break;
            case '$notIn':
              where[field].notIn = Array.isArray(value)
                ? value.map(convertType)
                : String(value).split(',').map(convertType);
              break;
          }
        } else {
          // Handle simple equality: filters[field]=value
          const simpleMatch = key.match(/^filters\[(\w+)\]$/);
          if (simpleMatch) {
            const [, field] = simpleMatch;
            const value = (params as Record<string, any>)[key];
            const fieldDef = modelDef?.fields?.find(
              (f: FieldDefinition) => f.name === field
            );
            let typedValue = value;
            if (fieldDef?.type === 'Int') typedValue = Number(value);
            if (fieldDef?.type === 'Boolean') typedValue = value === 'true';
            where[field] = typedValue;
          }
        }
      }

      try {
        const [data, total] = await fastify.prisma.$transaction([
          prismaModel.findMany({
            skip,
            take: limit,
            orderBy: sort !== 'id' ? orderBy : undefined,
            where: Object.keys(where).length > 0 ? where : undefined,
          }),
          prismaModel.count({
            where: Object.keys(where).length > 0 ? where : undefined,
          }),
        ]);

        return {
          data,
          meta: {
            total,
            page,
            limit,
            pages: Math.ceil(total / limit),
          },
        };
      } catch (error: any) {
        // Fallback: try without sorting if it failed
        try {
          const [data, total] = await fastify.prisma.$transaction([
            prismaModel.findMany({
              skip,
              take: limit,
              where: Object.keys(where).length > 0 ? where : undefined,
            }),
            prismaModel.count({
              where: Object.keys(where).length > 0 ? where : undefined,
            }),
          ]);
          return {
            data,
            meta: { total, page, limit, pages: Math.ceil(total / limit) },
          };
        } catch (retryError) {
          fastify.log.error(error);
          return reply
            .code(500)
            .send({ error: 'Failed to fetch data', details: error.message });
        }
      }
    }
  );

  // GET /_admin/data/:model/:id - Get single record
  fastify.get<{ Params: { model: string; id: string } }>(
    '/data/:model/:id',
    {
      schema: {
        tags: ['Admin - Data Explorer'],
        description: 'Get a single record by ID',
        params: {
          type: 'object',
          properties: {
            model: { type: 'string' },
            id: { type: 'string' },
          },
          required: ['model', 'id'],
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: { type: 'object', additionalProperties: true },
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
      const { model, id } = req.params;
      const prismaModel = getModel(model);

      if (!prismaModel) {
        return reply.code(404).send({ error: `Model '${model}' not found` });
      }

      try {
        const data = await prismaModel.findUnique({
          where: { id },
        });

        if (!data) {
          return reply.code(404).send({ error: 'Record not found' });
        }

        return { data };
      } catch (error: any) {
        // Handle cases where ID might be Int
        if (error.message?.includes('Argument `id`')) {
          try {
            const data = await prismaModel.findUnique({
              where: { id: parseInt(id) },
            });
            if (!data)
              return reply.code(404).send({ error: 'Record not found' });
            return { data };
          } catch (e) {
            return reply
              .code(400)
              .send({ error: 'Invalid ID format', details: error.message });
          }
        }
        return reply
          .code(500)
          .send({ error: 'Database error', details: error.message });
      }
    }
  );

  // POST /_admin/data/:model - Create record
  fastify.post<{ Params: { model: string }; Body: any }>(
    '/data/:model',
    {
      schema: {
        tags: ['Admin - Data Explorer'],
        description: 'Create a new record',
        params: {
          type: 'object',
          properties: {
            model: { type: 'string' },
          },
          required: ['model'],
        },
        body: {
          type: 'object',
          additionalProperties: true,
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { model } = req.params;
      const prismaModel = getModel(model);

      if (!prismaModel) {
        return reply.code(404).send({ error: `Model '${model}' not found` });
      }

      try {
        const transformedData = transformData(model, req.body);
        const data = await prismaModel.create({
          data: transformedData,
        });
        return { success: true, data };
      } catch (error: any) {
        return reply
          .code(400)
          .send({ error: 'Failed to create record', details: error.message });
      }
    }
  );

  // PUT /_admin/data/:model/:id - Update record
  fastify.put<{ Params: { model: string; id: string }; Body: any }>(
    '/data/:model/:id',
    {
      schema: {
        tags: ['Admin - Data Explorer'],
        description: 'Update a record',
        params: {
          type: 'object',
          properties: {
            model: { type: 'string' },
            id: { type: 'string' },
          },
          required: ['model', 'id'],
        },
        body: {
          type: 'object',
          additionalProperties: true,
        },
        response: {
          200: {
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              data: { type: 'object', additionalProperties: true },
            },
          },
        },
      },
    },
    async (req, reply) => {
      const { model, id } = req.params;
      const prismaModel = getModel(model);

      if (!prismaModel) {
        return reply.code(404).send({ error: `Model '${model}' not found` });
      }

      try {
        const transformedData = transformData(model, req.body);
        const data = await prismaModel.update({
          where: { id },
          data: transformedData,
        });
        return { success: true, data };
      } catch (error: any) {
        // Try Int ID
        if (error.message?.includes('Argument `id`')) {
          try {
            const transformedData = transformData(model, req.body);
            const data = await prismaModel.update({
              where: { id: parseInt(id) },
              data: transformedData,
            });
            return { success: true, data };
          } catch (e) {
            return reply.code(400).send({
              error: 'Failed to update record',
              details: error.message,
            });
          }
        }
        return reply
          .code(400)
          .send({ error: 'Failed to update record', details: error.message });
      }
    }
  );

  // DELETE /_admin/data/:model/:id - Delete record
  fastify.delete<{ Params: { model: string; id: string } }>(
    '/data/:model/:id',
    {
      schema: {
        tags: ['Admin - Data Explorer'],
        description: 'Delete a record',
        params: {
          type: 'object',
          properties: {
            model: { type: 'string' },
            id: { type: 'string' },
          },
          required: ['model', 'id'],
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
      const { model, id } = req.params;
      const prismaModel = getModel(model);

      if (!prismaModel) {
        return reply.code(404).send({ error: `Model '${model}' not found` });
      }

      try {
        await prismaModel.delete({
          where: { id },
        });
        return { success: true, message: 'Record deleted' };
      } catch (error: any) {
        // Try Int ID
        if (error.message?.includes('Argument `id`')) {
          try {
            await prismaModel.delete({
              where: { id: parseInt(id) },
            });
            return { success: true, message: 'Record deleted' };
          } catch (e) {
            return reply.code(400).send({
              error: 'Failed to delete record',
              details: error.message,
            });
          }
        }
        return reply
          .code(400)
          .send({ error: 'Failed to delete record', details: error.message });
      }
    }
  );
}

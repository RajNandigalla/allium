import { FastifyInstance } from 'fastify';
import { ModelDefinition } from '@allium/core';

/**
 * Map Prisma field types to JSON Schema types
 */
function mapPrismaTypeToJsonSchema(prismaType: string): string {
  const typeMap: Record<string, string> = {
    String: 'string',
    Int: 'integer',
    Float: 'number',
    Boolean: 'boolean',
    DateTime: 'string',
    Json: 'object',
  };

  return typeMap[prismaType] || 'string';
}

/**
 * Generate JSON Schema properties from model fields
 */
function generateProperties(fields: any[]): Record<string, any> {
  const props: Record<string, any> = {};

  for (const field of fields) {
    props[field.name] = {
      type: mapPrismaTypeToJsonSchema(field.type),
    };

    // Add format for DateTime
    // if (field.type === 'DateTime') {
    //   props[field.name].format = 'date-time';
    // }

    // Add description for unique fields
    if (field.unique) {
      props[field.name].description = 'Must be unique';
    }
  }

  return props;
}

/**
 * Register Swagger schemas for all models
 */
export function registerSwaggerSchemas(
  fastify: FastifyInstance,
  models: ModelDefinition[]
): void {
  for (const model of models) {
    // Support both model.fields (from schema.json) and model.metadata.fields (from introspection)
    const fields = (model as any).fields || model.metadata?.fields;

    if (!fields || fields.length === 0) {
      fastify.log.warn(
        `No fields found for model ${model.name}, skipping schema registration`
      );
      continue;
    }

    const properties = generateProperties(fields);
    const required = fields
      .filter((f: any) => f.required !== false) // required is true by default
      .map((f: any) => f.name);

    // Add auto-generated fields to response schema
    const responseProperties = {
      ...properties,
      id: { type: 'string', description: 'Unique identifier' },
      uuid: { type: 'string', description: 'UUID identifier' },
      createdAt: {
        type: 'string',
        format: 'date-time',
        description: 'Creation timestamp',
      },
      updatedAt: {
        type: 'string',
        format: 'date-time',
        description: 'Last update timestamp',
      },
    };

    // Register schema for the model (used in responses)
    fastify.addSchema({
      $id: `${model.name}Schema`,
      type: 'object',
      properties: responseProperties,
      required,
    });

    // Register create schema (without id, createdAt, updatedAt)
    const createProperties = { ...properties };
    delete createProperties.id;
    delete createProperties.uuid;
    delete createProperties.createdAt;
    delete createProperties.updatedAt;

    fastify.addSchema({
      $id: `${model.name}CreateSchema`,
      type: 'object',
      properties: createProperties,
      required: required.filter(
        (r: string) =>
          r !== 'id' && r !== 'uuid' && r !== 'createdAt' && r !== 'updatedAt'
      ),
    });

    // Register update schema (all fields optional)
    fastify.addSchema({
      $id: `${model.name}UpdateSchema`,
      type: 'object',
      properties: createProperties,
    });
  }
}

/**
 * Get Swagger schema for create operation
 */
export function getCreateSchema(model: ModelDefinition) {
  return {
    tags: [model.name],
    description: `Create a new ${model.name}`,
    body: { $ref: `${model.name}CreateSchema#` },
    response: {
      201: { $ref: `${model.name}Schema#` },
    },
  };
}

/**
 * Get Swagger schema for list operation
 */
export function getListSchema(model: ModelDefinition) {
  return {
    tags: [model.name],
    description: `List all ${model.name} records`,
    querystring: {
      type: 'object',
      properties: {
        page: { type: 'integer', minimum: 1, default: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
        sort: {
          type: 'string',
          description: 'Sort field:order (e.g., createdAt:desc)',
        },
        filter: { type: 'string', description: 'Filter conditions' },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          data: {
            type: 'array',
            items: { $ref: `${model.name}Schema#` },
          },
          pagination: {
            type: 'object',
            properties: {
              page: { type: 'integer' },
              limit: { type: 'integer' },
              total: { type: 'integer' },
            },
          },
        },
      },
    },
  };
}

/**
 * Get Swagger schema for get by ID operation
 */
export function getByIdSchema(model: ModelDefinition) {
  return {
    tags: [model.name],
    description: `Get ${model.name} by ID`,
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      required: ['id'],
    },
    response: {
      200: { $ref: `${model.name}Schema#` },
      404: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  };
}

/**
 * Get Swagger schema for update operation
 */
export function getUpdateSchema(model: ModelDefinition) {
  return {
    tags: [model.name],
    description: `Update ${model.name} by ID`,
    params: {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      required: ['id'],
    },
    body: { $ref: `${model.name}UpdateSchema#` },
    response: {
      200: { $ref: `${model.name}Schema#` },
      404: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  };
}

/**
 * Get Swagger schema for delete operation
 */
export function getDeleteSchema(model: ModelDefinition) {
  return {
    tags: [model.name],
    description: `Delete ${model.name} by ID`,
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
          message: { type: 'string' },
        },
      },
      404: {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      },
    },
  };
}

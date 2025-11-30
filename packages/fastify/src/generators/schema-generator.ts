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
 * Inject relation foreign keys into properties
 */
function injectRelationFields(
  properties: Record<string, any>,
  model: ModelDefinition
): Record<string, any> {
  if (!model.relations) return properties;

  const newProps = { ...properties };

  for (const rel of model.relations) {
    if (rel.type === 'polymorphic' && rel.models) {
      // Polymorphic relations: add multiple foreign keys
      for (const targetModel of rel.models) {
        const fieldName =
          targetModel.charAt(0).toLowerCase() + targetModel.slice(1);
        const fkName = `${fieldName}Id`;

        newProps[fkName] = {
          type: 'string',
          description: `Foreign key for ${targetModel} (Polymorphic)`,
        };
      }
    } else if ((rel.type === '1:1' || rel.type === '1:n') && rel.model) {
      // Regular 1:1 and 1:n relations: add single foreign key
      const foreignKey = rel.foreignKey || `${rel.name}Id`;
      const isOptional = rel.required === false;

      newProps[foreignKey] = {
        type: 'string',
        description: `Foreign key for ${rel.model}${
          isOptional ? ' (optional)' : ''
        }`,
      };
    }
    // n:m relations don't have foreign keys in the model itself
  }

  return newProps;
}

/**
 * Inject relation objects into properties (for response schema)
 */
function injectRelationObjects(
  properties: Record<string, any>,
  model: ModelDefinition
): Record<string, any> {
  if (!model.relations) return properties;

  const newProps = { ...properties };

  for (const rel of model.relations) {
    if (rel.type === '1:1' || rel.type === '1:n') {
      if (rel.model) {
        // Add the related model as an optional property
        newProps[rel.name] = {
          $ref: `${rel.model}Schema#`,
          description: `Related ${rel.model} record`,
        };
      }
    } else if (rel.type === 'n:m') {
      if (rel.model) {
        newProps[rel.name] = {
          type: 'array',
          items: { $ref: `${rel.model}Schema#` },
          description: `Related ${rel.model} records`,
        };
      }
    }
    // Polymorphic relations are harder to type in static schema without oneOf
    // For now we skip them or could use type: object
  }

  return newProps;
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

    let properties = generateProperties(fields);
    properties = injectRelationFields(properties, model);
    const required = fields
      .filter((f: any) => f.required !== false) // required is true by default
      .map((f: any) => f.name);

    // Add auto-generated fields to response schema
    // Also inject relation objects (e.g. facility object) for populate support
    const responseProperties = {
      ...injectRelationObjects(properties, model),
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

    // Register create schema (without id, createdAt, updatedAt, and writePrivate fields)
    const createProperties = { ...properties };
    delete createProperties.id;
    delete createProperties.uuid;
    delete createProperties.createdAt;
    delete createProperties.updatedAt;

    // Remove writePrivate fields from create schema
    for (const field of fields) {
      if (field.writePrivate) {
        delete createProperties[field.name];
      }
    }

    fastify.addSchema({
      $id: `${model.name}CreateSchema`,
      type: 'object',
      properties: createProperties,
      required: required.filter(
        (r: string) =>
          r !== 'id' &&
          r !== 'uuid' &&
          r !== 'createdAt' &&
          r !== 'updatedAt' &&
          // Exclude writePrivate fields
          !fields.find((f: any) => f.name === r && f.writePrivate) &&
          // Exclude fields with default values from required list
          !fields.find((f: any) => f.name === r && f.default !== undefined)
      ),
    });

    // Register update schema (all fields optional, excluding writePrivate)
    const updateProperties = { ...createProperties };
    // writePrivate fields are already removed from createProperties

    fastify.addSchema({
      $id: `${model.name}UpdateSchema`,
      type: 'object',
      properties: updateProperties,
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
        cursor: { type: 'string', description: 'Cursor for pagination' },
        page: { type: 'integer', minimum: 1 },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
        sort: {
          type: 'string',
          description: 'Sort field:order (e.g., createdAt:desc)',
        },
        filter: { type: 'string', description: 'Filter conditions' },
        populate: {
          type: 'string',
          description: 'Comma-separated list of relations to populate',
        },
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
              // Cursor-based pagination fields
              nextCursor: { type: ['string', 'null'] },
              hasMore: { type: 'boolean' },
              // Offset-based pagination fields (backward compatible)
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
    querystring: {
      type: 'object',
      properties: {
        populate: {
          type: 'string',
          description: 'Comma-separated list of relations to populate',
        },
      },
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

import { FastifyInstance } from 'fastify';
import {
  ModelDefinition,
  SchemaIntrospector,
  ValidationError,
} from '@allium/core';
import { Prisma } from '@prisma/client';
import {
  executeBeforeCreate,
  executeAfterCreate,
  executeBeforeUpdate,
  executeAfterUpdate,
  executeBeforeDelete,
  executeAfterDelete,
  executeBeforeFind,
  executeAfterFind,
} from '../utils/hook-executor';
import {
  getCreateSchema,
  getListSchema,
  getByIdSchema,
  getUpdateSchema,
  getDeleteSchema,
} from './schema-generator';
import { filterPrivateFields } from '../utils/field-filter';
import { addComputedFields } from '../utils/computed-fields';
import { applyMasking } from '../utils/masked-fields';

interface RouteOptions {
  routePrefix?: string;
  version?: string;
}

/**
 * Build Prisma query from request parameters
 */
function buildPrismaQuery(
  model: ModelDefinition,
  params: Record<string, any>
): any {
  const { page = 1, limit = 10 } = params;

  const query: any = {
    skip: (Number(page) - 1) * Number(limit),
    take: Number(limit),
  };

  // 1. Handle Sorting (Strapi style: sort[0]=Field:Order)
  const sortKeys = Object.keys(params).filter((k) => /^sort\[\d+\]$/.test(k));
  if (sortKeys.length > 0) {
    // Sort keys by index
    sortKeys.sort((a, b) => {
      const idxA = Number(a.match(/^sort\[(\d+)\]$/)![1]);
      const idxB = Number(b.match(/^sort\[(\d+)\]$/)![1]);
      return idxA - idxB;
    });

    query.orderBy = sortKeys.map((key) => {
      const [field, order] = params[key].split(':');
      return { [field]: order === 'desc' ? 'desc' : 'asc' };
    });
  } else if (params.sort) {
    // Fallback for simple sort=Field:Order
    const [field, order] = params.sort.split(':');
    query.orderBy = { [field]: order || 'asc' };
  } else {
    // Default sort
    const hasCreatedAt = model.fields?.some((f) => f.name === 'createdAt');
    if (hasCreatedAt) {
      query.orderBy = { createdAt: 'desc' };
    } else {
      query.orderBy = { id: 'asc' };
    }
  }

  // 2. Handle Filtering (Strapi style: filters[field][$op]=value)
  const filterKeys = Object.keys(params).filter((k) => k.startsWith('filters'));
  const where: any = {};

  for (const key of filterKeys) {
    // Match filters[field][$op] or filters[nested.field][$op]
    const match = key.match(/^filters\[([\w.]+)\]\[(\$\w+)\]$/);
    if (match) {
      const [, fieldPath, op] = match;
      const value = params[key];

      // Handle JSON nested filter
      if (fieldPath.includes('.')) {
        const [rootField, ...nestedPath] = fieldPath.split('.');

        if (!where[rootField]) where[rootField] = {};

        let prismaOp = 'equals';
        if (op === '$eq') prismaOp = 'equals';
        else if (op === '$ne') prismaOp = 'not';
        else if (op === '$gt') prismaOp = 'gt';
        else if (op === '$gte') prismaOp = 'gte';
        else if (op === '$lt') prismaOp = 'lt';
        else if (op === '$lte') prismaOp = 'lte';
        else if (op === '$contains') prismaOp = 'string_contains';
        else if (op === '$startsWith') prismaOp = 'string_starts_with';
        else if (op === '$endsWith') prismaOp = 'string_ends_with';

        where[rootField] = {
          path: nestedPath,
          [prismaOp]: value,
        };
        continue;
      }

      const field = fieldPath;
      if (!where[field]) where[field] = {};

      // Helper to convert type based on model definition
      const convertType = (val: any) => {
        const fieldDef = model.fields?.find((f) => f.name === field);
        if (!fieldDef) return val;
        if (fieldDef.type === 'Int') return Number(val);
        if (fieldDef.type === 'Boolean') return val === 'true';
        if (fieldDef.type === 'DateTime') return new Date(val);
        return val;
      };

      const typedValue = convertType(value);

      switch (op) {
        case '$eq':
          where[field].equals = typedValue;
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
          break;
        case '$startsWith':
          where[field].startsWith = String(value);
          break;
        case '$endsWith':
          where[field].endsWith = String(value);
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
        const value = params[key];
        // Convert type
        const fieldDef = model.fields?.find((f) => f.name === field);
        let typedValue = value;
        if (fieldDef?.type === 'Int') typedValue = Number(value);
        if (fieldDef?.type === 'Boolean') typedValue = value === 'true';

        where[field] = typedValue;
      }
    }
  }

  if (Object.keys(where).length > 0) {
    query.where = where;
  }

  return query;
}

/**
 * Generate CRUD routes for a single model
 */
export async function generateModelRoutes(
  fastify: FastifyInstance,
  model: ModelDefinition,
  allModels: ModelDefinition[],
  opts: RouteOptions = {}
): Promise<void> {
  const modelName = model.name;
  const modelLower = modelName.toLowerCase();

  // Determine effective version: model override > global default
  const version = model.api?.version || opts.version;

  // Construct base path
  // If model has explicit prefix, use it (assume it includes version if needed)
  // Otherwise: /{globalPrefix}/{version}/{modelName}
  let baseRoutePath = '';

  if (model.api?.prefix) {
    baseRoutePath = model.api.prefix;
  } else {
    const prefix = opts.routePrefix || '/api';

    const parts = [prefix];
    if (version) parts.push(version);
    parts.push(modelLower);

    baseRoutePath = parts.join('/').replace(/\/+/g, '/');
  }

  // Get Prisma delegate for this model
  const prismaModel = (fastify as any).prisma[modelLower];

  if (!prismaModel) {
    fastify.log.warn(
      `Prisma model '${modelLower}' not found. Skipping route generation for ${modelName}.`
    );
    return;
  }

  // Introspect model to get metadata
  const introspector = new SchemaIntrospector();
  try {
    model.metadata = await introspector.introspect(modelName);
  } catch (error) {
    fastify.log.warn({ error }, `Could not introspect model ${modelName}`);
  }

  // Helper to check if operation is enabled
  const isOperationEnabled = (operation: string): boolean => {
    if (!model.api?.operations) return true; // All enabled by default
    return model.api.operations.includes(operation as any);
  };

  // Helper to get route path
  const getRoutePath = (
    operation: string,
    defaultSuffix: string = ''
  ): string => {
    // Check if custom path is defined in model.routes
    if (model.routes?.[operation]?.path) {
      const customPath = model.routes[operation].path!;
      // If custom path starts with /, treat it as absolute (relative to API root or just use as is?)
      // For now, let's assume it replaces the suffix but keeps the prefix if it's relative,
      // or if we want full control, maybe we should allow full override.
      // The plan said: "use it as the suffix appended to routePath" OR "If not, use the default suffix".
      // Let's stick to: baseRoutePath + (customPath OR defaultSuffix)
      // BUT, if the user wants /register instead of /api/users/register, they might expect full control.
      // However, keeping it under the prefix is safer for now.
      // Let's assume it replaces the default suffix.
      return `${baseRoutePath}${customPath}`;
    }
    return `${baseRoutePath}${defaultSuffix}`;
  };

  // CREATE - POST /{model}
  if (isOperationEnabled('create')) {
    const path = getRoutePath('create', '');
    fastify.post(
      path,
      {
        schema: getCreateSchema(model),
        config: {
          rateLimit: model.api?.rateLimit,
        },
      },
      async (request, reply) => {
        try {
          let data = request.body as any;

          // Execute beforeCreate hook
          data = await executeBeforeCreate(model, data, request);

          // Create record
          const result = await prismaModel.create({ data });

          // Execute afterCreate hook
          await executeAfterCreate(model, result, request);

          return reply
            .status(201)
            .send(
              applyMasking(
                addComputedFields(filterPrivateFields(result, model), model),
                model
              )
            );
        } catch (error) {
          if (error instanceof ValidationError) {
            return (reply as any).status(400).send({
              statusCode: 400,
              error: 'Bad Request',
              message: 'Validation failed',
              errors: error.errors,
            });
          }
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
              return (reply as any).status(409).send({
                error: 'A record with this unique field already exists',
              });
            }
          }
          throw error;
        }
      }
    );
  }

  // LIST - GET /{model}
  if (isOperationEnabled('list')) {
    const path = getRoutePath('list', '');
    fastify.get(
      path,
      {
        schema: getListSchema(model),
        config: {
          rateLimit: model.api?.rateLimit,
        },
      },
      async (request, reply) => {
        const params = request.query as any;
        const { cursor, limit = 10, page } = params;

        // Use offset-based pagination only if page is explicitly provided
        if (page && !cursor) {
          // Offset-based pagination (backward compatible)
          let query = buildPrismaQuery(model, params);

          // Execute beforeFind hook
          query = await executeBeforeFind(model, query, request);

          // Fetch records
          const [data, total] = await Promise.all([
            prismaModel.findMany(query),
            prismaModel.count({ where: query.where }),
          ]);

          // Execute afterFind hook
          const processedData = await executeAfterFind(model, data, request);

          return {
            data: applyMasking(
              addComputedFields(
                filterPrivateFields(processedData, model),
                model
              ),
              model
            ),
            pagination: {
              page: parseInt(page) || 1,
              limit: parseInt(limit),
              total,
            },
          };
        }

        // Cursor-based pagination (default)
        try {
          let cursorId;
          if (cursor) {
            // Decode cursor
            const decodedCursor = JSON.parse(
              Buffer.from(cursor, 'base64').toString()
            );
            cursorId = parseId(decodedCursor.id);
          }

          // Build query with cursor
          let query = buildPrismaQuery(model, params);
          query.take = parseInt(limit) + 1; // Fetch one extra to check hasMore

          if (cursorId) {
            query.cursor = { id: cursorId };
            query.skip = 1; // Skip the cursor record itself
          }

          query.orderBy = query.orderBy || { id: 'asc' };

          // Execute beforeFind hook
          query = await executeBeforeFind(model, query, request);

          // Fetch records
          const data = await prismaModel.findMany(query);

          // Execute afterFind hook
          await executeAfterFind(model, data, request);

          // Check if there are more records
          const hasMore = data.length > parseInt(limit);
          const records = hasMore ? data.slice(0, parseInt(limit)) : data;

          // Generate next cursor
          const nextCursor =
            hasMore && records.length > 0
              ? Buffer.from(
                  JSON.stringify({ id: records[records.length - 1].id })
                ).toString('base64')
              : null;

          return {
            data: applyMasking(
              addComputedFields(filterPrivateFields(records, model), model),
              model
            ),
            pagination: {
              nextCursor,
              hasMore,
              limit: parseInt(limit),
            },
          };
        } catch (error) {
          return (reply as any).code(400).send({
            error: 'Invalid cursor',
          });
        }
      }
    );
  }

  // Helper to parse ID based on model type
  const idField = model.metadata?.fields.find((f) => f.name === 'id');
  const isIntId = idField?.type === 'Int';

  const parseId = (id: string) => (isIntId ? parseInt(id, 10) : id);

  // GET BY ID - GET /{model}/:id
  if (isOperationEnabled('read')) {
    const path = getRoutePath('read', '/:id');
    fastify.get(
      path,
      {
        schema: getByIdSchema(model),
        config: {
          rateLimit: model.api?.rateLimit,
        },
      },
      async (request, reply) => {
        const { id } = request.params as { id: string };
        const parsedId = parseId(id);

        const record = await prismaModel.findUnique({
          where: { id: parsedId },
        });

        if (!record) {
          return reply.status(404).send({
            error: `${modelName} not found`,
          });
        }

        // Check if soft deleted
        if (model.softDelete && (record as any).deletedAt) {
          return reply.status(404).send({
            error: `${modelName} not found`,
          });
        }

        return applyMasking(
          addComputedFields(filterPrivateFields(record, model), model),
          model
        );
      }
    );
  }

  // UPDATE - PATCH /{model}/:id
  if (isOperationEnabled('update')) {
    const path = getRoutePath('update', '/:id');
    fastify.patch(
      path,
      {
        schema: getUpdateSchema(model),
        config: {
          rateLimit: model.api?.rateLimit,
        },
      },
      async (request, reply) => {
        try {
          const { id } = request.params as { id: string };
          const parsedId = parseId(id);
          let data = request.body as any;

          // Execute beforeUpdate hook
          data = await executeBeforeUpdate(
            model,
            String(parsedId),
            data,
            request
          );

          // Get previous data for afterUpdate hook
          const previousData = await prismaModel.findUnique({
            where: { id: parsedId },
          });

          if (!previousData) {
            return reply.status(404).send({
              error: `${modelName} not found`,
            });
          }

          // Check if soft deleted
          if (model.softDelete && (previousData as any).deletedAt) {
            return reply.status(404).send({
              error: `${modelName} not found`,
            });
          }

          // Update record
          const result = await prismaModel.update({
            where: { id: parsedId },
            data,
          });

          // Execute afterUpdate hook
          await executeAfterUpdate(model, result, previousData, request);

          return reply
            .status(200)
            .send(
              applyMasking(
                addComputedFields(filterPrivateFields(result, model), model),
                model
              )
            );
        } catch (error) {
          if (error instanceof ValidationError) {
            return (reply as any).status(400).send({
              statusCode: 400,
              error: 'Bad Request',
              message: 'Validation failed',
              errors: error.errors,
            });
          }
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
              return reply.status(404).send({
                error: `${modelName} not found`,
              });
            }
          }
          throw error;
        }
      }
    );
  }

  // DELETE - DELETE /{model}/:id
  if (isOperationEnabled('delete')) {
    const path = getRoutePath('delete', '/:id');
    fastify.delete(
      path,
      {
        schema: getDeleteSchema(model),
        config: {
          rateLimit: model.api?.rateLimit,
        },
      },
      async (request, reply) => {
        try {
          const { id } = request.params as { id: string };
          const parsedId = parseId(id);

          // Get record for beforeDelete hook
          const record = await prismaModel.findUnique({
            where: { id: parsedId },
          });

          if (!record) {
            return reply.status(404).send({
              error: `${modelName} not found`,
            });
          }

          // Check if soft deleted
          if (model.softDelete && (record as any).deletedAt) {
            return reply.status(404).send({
              error: `${modelName} not found`,
            });
          }

          // Execute beforeDelete hook
          await executeBeforeDelete(model, String(parsedId), request);

          // Delete record (or soft delete)
          if (model.softDelete) {
            const updateData: any = { deletedAt: new Date() };

            // Add deletedBy if audit trail is enabled
            if (model.auditTrail && (request as any).user?.id) {
              updateData.deletedBy = (request as any).user.id;
            }

            await prismaModel.update({
              where: { id: parsedId },
              data: updateData,
            });

            // Application-Level Cascade for Soft Deletes
            for (const otherModel of allModels) {
              // Find relations in other models that point to this model with onDelete: Cascade
              const cascadingRelations = otherModel.relations?.filter(
                (r) => r.model === model.name && r.onDelete === 'Cascade'
              );

              if (cascadingRelations && cascadingRelations.length > 0) {
                const otherPrismaModel = (fastify as any).prisma[
                  otherModel.name.toLowerCase()
                ];

                for (const relation of cascadingRelations) {
                  const foreignKey =
                    relation.foreignKey || `${relation.name}Id`;

                  // If other model supports soft delete, soft delete the children
                  if (otherModel.softDelete) {
                    const childUpdateData: any = { deletedAt: new Date() };
                    if (otherModel.auditTrail && (request as any).user?.id) {
                      childUpdateData.deletedBy = (request as any).user.id;
                    }

                    await otherPrismaModel.updateMany({
                      where: { [foreignKey]: parsedId },
                      data: childUpdateData,
                    });
                  } else {
                    // If other model is hard delete, we hard delete them
                    // (This mimics DB cascade behavior)
                    await otherPrismaModel.deleteMany({
                      where: { [foreignKey]: parsedId },
                    });
                  }
                }
              }
            }
          } else {
            await prismaModel.delete({
              where: { id: parsedId },
            });
          }

          // Execute afterDelete hook
          await executeAfterDelete(model, String(parsedId), record, request);

          return {
            message: `${modelName} deleted successfully`,
          };
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
              return reply.status(404).send({
                error: `${modelName} not found`,
              });
            }
          }
          throw error;
        }
      }
    );

    // RESTORE - POST /{model}/:id/restore
    if (model.softDelete) {
      // Use custom path if defined, otherwise default
      // Note: 'restore' is not a standard operation in ApiOperation type yet,
      // but we can check if user defined a route for it if we extend the type.
      // For now, let's assume it's a sub-resource of update or a custom operation.
      // Since 'restore' isn't in ApiOperation, we'll check model.routes['restore'] specifically if we want to support it,
      // or just append /restore to the update path?
      // Let's check for a specific 'restore' route config even if not in the main enum,
      // or just hardcode the suffix for now unless we want to be very flexible.
      // Given the task is "Custom Endpoint Paths", let's try to support it if possible.
      // But model.routes key is typed as string in the definition I saw?
      // "routes?: Record<string, RouteConfig>;" -> Yes, string keys.

      const restorePath = model.routes?.['restore']?.path
        ? `${baseRoutePath}${model.routes['restore'].path}`
        : `${baseRoutePath}/:id/restore`;

      fastify.post(
        restorePath,
        {
          schema: {
            tags: [model.name],
            description: `Restore soft-deleted ${model.name}`,
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
          },
        },
        async (request, reply) => {
          try {
            const { id } = request.params as { id: string };
            const parsedId = parseId(id);

            // Check if record exists (even if deleted)
            const record = await prismaModel.findUnique({
              where: { id: parsedId },
            });

            if (!record) {
              return reply.status(404).send({
                error: `${modelName} not found`,
              });
            }

            // Restore record
            await prismaModel.update({
              where: { id: parsedId },
              data: { deletedAt: null },
            });

            return {
              message: `${modelName} restored successfully`,
            };
          } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
              if (error.code === 'P2025') {
                return reply.status(404).send({
                  error: `${modelName} not found`,
                });
              }
            }
            throw error;
          }
        }
      );

      // FORCE DELETE - DELETE /{model}/:id/force
      const forceDeletePath = model.routes?.['forceDelete']?.path
        ? `${baseRoutePath}${model.routes['forceDelete'].path}`
        : `${baseRoutePath}/:id/force`;

      fastify.delete(
        forceDeletePath,
        {
          schema: {
            tags: [model.name],
            description: `Permanently delete ${model.name}`,
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
          },
        },
        async (request, reply) => {
          try {
            const { id } = request.params as { id: string };
            const parsedId = parseId(id);

            // Permanently delete record
            await prismaModel.delete({
              where: { id: parsedId },
            });

            return {
              message: `${modelName} permanently deleted`,
            };
          } catch (error) {
            if (error instanceof Prisma.PrismaClientKnownRequestError) {
              if (error.code === 'P2025') {
                return reply.status(404).send({
                  error: `${modelName} not found`,
                });
              }
            }
            throw error;
          }
        }
      );
    }
  }

  fastify.log.info(
    `Generated CRUD routes for ${modelName} at ${baseRoutePath}`
  );
}

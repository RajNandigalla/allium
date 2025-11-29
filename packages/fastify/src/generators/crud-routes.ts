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

interface RouteOptions {
  routePrefix?: string;
}

/**
 * Build Prisma query from request parameters
 */
function buildPrismaQuery(params: {
  page?: number;
  limit?: number;
  sort?: string;
  filter?: string;
}): any {
  const { page = 1, limit = 10, sort } = params;

  const query: any = {
    skip: (page - 1) * limit,
    take: limit,
  };

  // Parse sort parameter (e.g., "createdAt:desc")
  if (sort) {
    const [field, order] = sort.split(':');
    query.orderBy = { [field]: order || 'asc' };
  }

  return query;
}

/**
 * Generate CRUD routes for a single model
 */
export async function generateModelRoutes(
  fastify: FastifyInstance,
  model: ModelDefinition,
  opts: RouteOptions = {}
): Promise<void> {
  const modelName = model.name;
  const modelLower = modelName.toLowerCase();
  const routePath = `${opts.routePrefix || '/api'}/${modelLower}`;

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

  // CREATE - POST /{model}
  fastify.post(
    routePath,
    {
      schema: getCreateSchema(model),
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

        return reply.status(201).send(result);
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

  // LIST - GET /{model}
  fastify.get(
    routePath,
    {
      schema: getListSchema(model),
    },
    async (request, reply) => {
      const params = request.query as any;
      let query = buildPrismaQuery(params);

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
        data: processedData,
        pagination: {
          page: params.page || 1,
          limit: params.limit || 10,
          total,
        },
      };
    }
  );

  // Helper to parse ID based on model type
  const idField = model.metadata?.fields.find((f) => f.name === 'id');
  const isIntId = idField?.type === 'Int';

  const parseId = (id: string) => (isIntId ? parseInt(id, 10) : id);

  // GET BY ID - GET /{model}/:id
  fastify.get(
    `${routePath}/:id`,
    {
      schema: getByIdSchema(model),
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

      return record;
    }
  );

  // UPDATE - PATCH /{model}/:id
  fastify.patch(
    `${routePath}/:id`,
    {
      schema: getUpdateSchema(model),
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

        return result;
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

  // DELETE - DELETE /{model}/:id
  fastify.delete(
    `${routePath}/:id`,
    {
      schema: getDeleteSchema(model),
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
    fastify.post(
      `${routePath}/:id/restore`,
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
    fastify.delete(
      `${routePath}/:id/force`,
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

  fastify.log.info(`Generated CRUD routes for ${modelName} at ${routePath}`);
}

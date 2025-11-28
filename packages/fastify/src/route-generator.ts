import { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { ModelDefinition, HookExecutor } from '@allium/core';
import { createHookContext } from './context';

/**
 * Generate CRUD routes for a model
 */
export function generateRoutes(
  app: FastifyInstance,
  model: ModelDefinition,
  prisma: PrismaClient,
  hookExecutor: HookExecutor,
  services: Record<string, any> = {},
  options: { prefix?: string } = {}
): void {
  const globalPrefix = options.prefix || '/api';
  const basePath = `${globalPrefix}/${model.name.toLowerCase()}`;
  const modelName = model.name.charAt(0).toLowerCase() + model.name.slice(1);

  // Helper for error handling
  const handleError = (error: any, reply: any) => {
    app.log.error(error);

    if (error.name === 'ValidationError') {
      return reply.status(400).send({
        error: 'Validation failed',
        details: error.errors,
      });
    }

    // Prisma error codes
    if (error.code === 'P2002') {
      return reply.status(409).send({
        error: 'Conflict',
        message: 'Unique constraint failed',
        fields: error.meta?.target,
      });
    }

    if (error.code === 'P2025') {
      return reply.status(404).send({
        error: 'Not Found',
        message: 'Record not found',
      });
    }

    if (error.message === 'SOFT_DELETE_HANDLED') {
      return reply.status(204).send();
    }

    reply.status(500).send({ error: 'Internal Server Error' });
  };

  // GET /api/product - List all
  app.get(basePath, async (request, reply) => {
    try {
      const context = createHookContext(request, prisma, services);
      const queryParams = request.query as Record<string, any>;

      // Pagination
      const page = Number(queryParams.page) || 1;
      const limit = Number(queryParams.limit) || 10;
      const skip = (page - 1) * limit;

      // Sorting
      let orderBy = undefined;
      if (queryParams.sort) {
        const sortField = queryParams.sort as string;
        if (sortField.startsWith('-')) {
          orderBy = { [sortField.substring(1)]: 'desc' };
        } else {
          orderBy = { [sortField]: 'asc' };
        }
      } else {
        // Default sort by createdAt if exists, else id
        orderBy = { createdAt: 'desc' }; // Fallback handled by Prisma if field doesn't exist? No, unsafe.
        // Safer default: undefined or check metadata
        orderBy = undefined;
      }

      // Filtering (exclude special params)
      const { page: _p, limit: _l, sort: _s, ...filters } = queryParams;

      // Build query
      let query: any = {
        skip,
        take: limit,
        where: filters, // Basic equality filtering
        orderBy,
      };

      // Execute beforeFind hook
      query = await hookExecutor.executeBeforeFind(model, query, context);

      // Fetch records
      let results = await (prisma as any)[modelName].findMany(query);
      const total = await (prisma as any)[modelName].count({
        where: query.where,
      });

      // Execute afterFind hook
      results = await hookExecutor.executeAfterFind(model, results, context);

      return {
        data: results,
        meta: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      handleError(error, reply);
    }
  });

  // GET /api/product/:id - Get one
  app.get(`${basePath}/:id`, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const context = createHookContext(request, prisma, services);

      // Build query
      let query: any = { where: { id } };

      // Execute beforeFind hook
      query = await hookExecutor.executeBeforeFind(model, query, context);

      // Fetch record
      const record = await (prisma as any)[modelName].findUnique(query);

      if (!record) {
        return reply.status(404).send({ error: 'Record not found' });
      }

      // Execute afterFind hook (with single record as array)
      const [result] = await hookExecutor.executeAfterFind(
        model,
        [record],
        context
      );

      return result;
    } catch (error) {
      handleError(error, reply);
    }
  });

  // POST /api/product - Create
  app.post(basePath, async (request, reply) => {
    try {
      const context = createHookContext(request, prisma, services);

      // Execute beforeCreate hook (includes validation)
      let data = await hookExecutor.executeBeforeCreate(
        model,
        request.body,
        context
      );

      // Create record
      const record = await (prisma as any)[modelName].create({ data });

      // Execute afterCreate hook
      await hookExecutor.executeAfterCreate(model, record, context);

      return reply.status(201).send(record);
    } catch (error: any) {
      handleError(error, reply);
    }
  });

  // PUT /api/product/:id - Update
  app.put(`${basePath}/:id`, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const context = createHookContext(request, prisma, services);

      // Get existing record
      const existing = await (prisma as any)[modelName].findUnique({
        where: { id },
      });

      if (!existing) {
        return reply.status(404).send({ error: 'Record not found' });
      }

      // Execute beforeUpdate hook (includes validation)
      let data = await hookExecutor.executeBeforeUpdate(
        model,
        id,
        request.body,
        context
      );

      // Update record
      const record = await (prisma as any)[modelName].update({
        where: { id },
        data,
      });

      // Execute afterUpdate hook
      await hookExecutor.executeAfterUpdate(model, record, existing, context);

      return record;
    } catch (error: any) {
      handleError(error, reply);
    }
  });

  // DELETE /api/product/:id - Delete
  app.delete(`${basePath}/:id`, async (request, reply) => {
    try {
      const { id } = request.params as { id: string };
      const context = createHookContext(request, prisma, services);

      // Get existing record
      const existing = await (prisma as any)[modelName].findUnique({
        where: { id },
      });

      if (!existing) {
        return reply.status(404).send({ error: 'Record not found' });
      }

      // Execute beforeDelete hook
      await hookExecutor.executeBeforeDelete(model, id, context);

      // Delete record
      await (prisma as any)[modelName].delete({ where: { id } });

      // Execute afterDelete hook
      await hookExecutor.executeAfterDelete(model, id, existing, context);

      return reply.status(204).send();
    } catch (error: any) {
      handleError(error, reply);
    }
  });
}

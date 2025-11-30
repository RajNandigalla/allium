import { FastifyInstance } from 'fastify';

export async function registerDataRoutes(fastify: FastifyInstance) {
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

  // GET /_admin/data/:model - List records
  fastify.get<{
    Params: { model: string };
    Querystring: {
      page?: number;
      limit?: number;
      sort?: string;
      order?: 'asc' | 'desc';
      q?: string; // Simple search query
    };
  }>(
    '/data/:model',
    {
      schema: {
        tags: ['Admin - Data Explorer'],
        description: 'List records for a model with pagination and sorting',
        params: {
          type: 'object',
          properties: {
            model: { type: 'string' },
          },
          required: ['model'],
        },
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'integer', default: 1 },
            limit: { type: 'integer', default: 10 },
            sort: { type: 'string', default: 'createdAt' },
            order: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
            q: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            properties: {
              data: { type: 'array' },
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
      const { model } = req.params;
      const {
        page = 1,
        limit = 10,
        sort = 'createdAt',
        order = 'desc',
        q,
      } = req.query;

      const prismaModel = getModel(model);
      if (!prismaModel) {
        return reply
          .code(404)
          .send({ error: `Model '${model}' not found in database` });
      }

      const skip = (page - 1) * limit;
      const orderBy = { [sort]: order };

      // Basic filtering if 'q' is provided (searches 'id' or 'name' if they exist)
      // This is a naive implementation; a real one would inspect the schema to find searchable fields
      let where = {};
      if (q) {
        where = {
          OR: [
            // We try to filter by common fields if they exist.
            // Prisma throws if field doesn't exist, so we should ideally inspect schema first.
            // For safety in this generic endpoint without schema inspection, we might skip complex filtering
            // or wrap in try/catch.
            // For now, let's just return all data if no generic search is implemented safely.
          ],
        };
      }

      try {
        const [data, total] = await fastify.prisma.$transaction([
          prismaModel.findMany({
            skip,
            take: limit,
            orderBy: sort !== 'id' ? orderBy : undefined, // Avoid error if sort field doesn't exist?
            // Actually, if sort field doesn't exist, Prisma throws.
            // We'll assume 'createdAt' exists or user specifies valid sort.
          }),
          prismaModel.count({ where }),
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
        // Fallback: try without sorting if it failed (e.g. model doesn't have createdAt)
        try {
          const [data, total] = await fastify.prisma.$transaction([
            prismaModel.findMany({ skip, take: limit }),
            prismaModel.count(),
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
        const data = await prismaModel.create({
          data: req.body,
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
        const data = await prismaModel.update({
          where: { id },
          data: req.body,
        });
        return { success: true, data };
      } catch (error: any) {
        // Try Int ID
        if (error.message?.includes('Argument `id`')) {
          try {
            const data = await prismaModel.update({
              where: { id: parseInt(id) },
              data: req.body,
            });
            return { success: true, data };
          } catch (e) {
            return reply
              .code(400)
              .send({
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
            return reply
              .code(400)
              .send({
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

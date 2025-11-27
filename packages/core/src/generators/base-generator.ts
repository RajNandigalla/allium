/**
 * Generates the base controller factory
 * This is shared across all models to eliminate duplication
 */
export function generateBaseController(): string {
  return `import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Generic CRUD controller factory
 * Creates controller handlers for any service
 */
export function createCrudController<T extends {
  create: (data: any) => Promise<any>;
  findAll: () => Promise<any[]>;
  findById: (id: string) => Promise<any>;
  update: (id: string, data: any) => Promise<any>;
  delete: (id: string) => Promise<any>;
}>(service: T, modelName: string) {
  return {
    async create(
      request: FastifyRequest<{ Body: any }>,
      reply: FastifyReply
    ) {
      const result = await service.create(request.body);
      return result;
    },

    async findAll() {
      return service.findAll();
    },

    async findById(
      request: FastifyRequest<{ Params: { id: string } }>
    ) {
      return service.findById(request.params.id);
    },

    async update(
      request: FastifyRequest<{ Params: { id: string }; Body: any }>
    ) {
      return service.update(request.params.id, request.body);
    },

    async delete(
      request: FastifyRequest<{ Params: { id: string } }>
    ) {
      return service.delete(request.params.id);
    },
  };
}
`;
}

/**
 * Generates the base routes factory
 */
export function generateBaseRoutes(): string {
  return `import { FastifyInstance } from 'fastify';
import { z } from 'zod';

/**
 * Generic CRUD routes factory
 * Creates REST routes for any model
 */
export function createCrudRoutes(
  handlers: {
    create: any;
    findAll: any;
    findById: any;
    update: any;
    delete: any;
  },
  schemas: {
    create: any;
    update: any;
    read: any;
  },
  modelName: string,
  operations: string[] = ['create', 'read', 'update', 'delete']
) {
  const tags = [modelName];

  return async (app: FastifyInstance) => {
    if (operations.includes('create')) {
      app.post('/', {
        schema: {
          body: schemas.create,
          tags,
          response: {
            201: schemas.read,
          },
        }
      }, handlers.create);
    }

    if (operations.includes('read')) {
      app.get('/', {
        schema: {
          tags,
          response: {
            200: z.array(schemas.read),
          },
        }
      }, handlers.findAll);

      app.get('/:id', {
        schema: {
          tags,
          params: z.object({ id: z.string().uuid() }),
          response: {
            200: schemas.read,
          },
        }
      }, handlers.findById);
    }

    if (operations.includes('update')) {
      app.put('/:id', {
        schema: {
          body: schemas.update,
          tags,
          params: z.object({ id: z.string().uuid() }),
          response: {
            200: schemas.read,
          },
        }
      }, handlers.update);
    }

    if (operations.includes('delete')) {
      app.delete('/:id', {
        schema: {
          tags,
          params: z.object({ id: z.string().uuid() }),
          response: {
            200: schemas.read,
          },
        }
      }, handlers.delete);
    }
  };
}
`;
}

/**
 * Generates the base resolver factory
 */
export function generateBaseResolver(): string {
  return `/**
 * Generic CRUD resolver factory
 * Creates GraphQL resolvers for any service
 */
export function createCrudResolver<T extends {
  create: (data: any) => Promise<any>;
  findAll: () => Promise<any[]>;
  findById: (id: number) => Promise<any>;
  update: (id: number, data: any) => Promise<any>;
  delete: (id: number) => Promise<any>;
}>(service: T, modelName: string) {
  const modelLower = modelName.toLowerCase();
  const modelPlural = modelLower + 's';

  return {
    Query: {
      [modelPlural]: async () => {
        return service.findAll();
      },
      [modelLower]: async (_: any, { id }: { id: number }) => {
        return service.findById(id);
      },
    },
    Mutation: {
      [\`create\${modelName}\`]: async (_: any, { input }: { input: any }) => {
        return service.create(input);
      },
      [\`update\${modelName}\`]: async (_: any, { id, input }: { id: number; input: any }) => {
        return service.update(id, input);
      },
      [\`delete\${modelName}\`]: async (_: any, { id }: { id: number }) => {
        return service.delete(id);
      },
    },
  };
}
`;
}

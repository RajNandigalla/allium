import { FastifyReply, FastifyRequest } from 'fastify';

/**
 * Generic CRUD controller factory
 * Creates controller handlers for any service
 */
export function createCrudController<
  T extends {
    create: (data: any) => Promise<any>;
    findAll: () => Promise<any[]>;
    findById: (id: number) => Promise<any>;
    update: (id: number, data: any) => Promise<any>;
    delete: (id: number) => Promise<any>;
  }
>(service: T, modelName: string) {
  return {
    async create(request: FastifyRequest<{ Body: any }>, reply: FastifyReply) {
      const result = await service.create(request.body);
      return result;
    },

    async findAll() {
      return service.findAll();
    },

    async findById(request: FastifyRequest<{ Params: { id: string } }>) {
      const id = parseInt(request.params.id);
      return service.findById(id);
    },

    async update(
      request: FastifyRequest<{ Params: { id: string }; Body: any }>
    ) {
      const id = parseInt(request.params.id);
      return service.update(id, request.body);
    },

    async delete(request: FastifyRequest<{ Params: { id: string } }>) {
      const id = parseInt(request.params.id);
      return service.delete(id);
    },
  };
}

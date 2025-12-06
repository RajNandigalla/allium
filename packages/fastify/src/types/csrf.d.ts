import '@fastify/csrf-protection';

declare module 'fastify' {
  interface FastifyReply {
    generateCsrf(opts?: any): Promise<string>;
    csrfProtection(request: FastifyRequest): Promise<void>;
  }
}

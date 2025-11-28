import { FastifyRequest } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { HookContext } from '@allium/core';

/**
 * Build HookContext from Fastify request
 */
export function createHookContext(
  request: FastifyRequest,
  prisma: PrismaClient,
  services: Record<string, any> = {}
): HookContext {
  return {
    prisma,
    user: (request as any).user, // Assumes auth middleware sets request.user
    request,
    services,
    logger: request.log,
    transaction: undefined,
  };
}

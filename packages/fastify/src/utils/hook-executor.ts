import { HookExecutor, HookContext, ModelDefinition } from '@allium/core';
import { FastifyRequest } from 'fastify';

const executor = new HookExecutor();

/**
 * Build hook context from Fastify request
 */
function buildContext(request: FastifyRequest): HookContext {
  return {
    prisma: (request.server as any).prisma,
    user: (request as any).user, // From auth plugin if available
    request,
    services: {},
    logger: request.log,
  };
}

/**
 * Execute beforeCreate hook
 */
export async function executeBeforeCreate(
  model: ModelDefinition,
  data: any,
  request: FastifyRequest
): Promise<any> {
  const context = buildContext(request);
  return await executor.executeBeforeCreate(model, data, context);
}

/**
 * Execute afterCreate hook
 */
export async function executeAfterCreate(
  model: ModelDefinition,
  record: any,
  request: FastifyRequest
): Promise<void> {
  const context = buildContext(request);
  await executor.executeAfterCreate(model, record, context);
}

/**
 * Execute beforeUpdate hook
 */
export async function executeBeforeUpdate(
  model: ModelDefinition,
  id: string,
  data: any,
  request: FastifyRequest
): Promise<any> {
  const context = buildContext(request);
  return await executor.executeBeforeUpdate(model, id, data, context);
}

/**
 * Execute afterUpdate hook
 */
export async function executeAfterUpdate(
  model: ModelDefinition,
  record: any,
  previousData: any,
  request: FastifyRequest
): Promise<void> {
  const context = buildContext(request);
  await executor.executeAfterUpdate(model, record, previousData, context);
}

/**
 * Execute beforeDelete hook
 */
export async function executeBeforeDelete(
  model: ModelDefinition,
  id: string,
  request: FastifyRequest
): Promise<void> {
  const context = buildContext(request);
  await executor.executeBeforeDelete(model, id, context);
}

/**
 * Execute afterDelete hook
 */
export async function executeAfterDelete(
  model: ModelDefinition,
  id: string,
  deletedData: any,
  request: FastifyRequest
): Promise<void> {
  const context = buildContext(request);
  await executor.executeAfterDelete(model, id, deletedData, context);
}

/**
 * Execute beforeFind hook
 */
export async function executeBeforeFind(
  model: ModelDefinition,
  query: any,
  request: FastifyRequest
): Promise<any> {
  const context = buildContext(request);
  return await executor.executeBeforeFind(model, query, context);
}

/**
 * Execute afterFind hook
 */
export async function executeAfterFind(
  model: ModelDefinition,
  results: any[],
  request: FastifyRequest
): Promise<any[]> {
  const context = buildContext(request);
  return await executor.executeAfterFind(model, results, context);
}

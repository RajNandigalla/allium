import { PrismaClient } from '@prisma/client';
import { FastifyRequest } from 'fastify';
import { ApiConfig, Field, Relation, RouteConfig } from '../types/model';

/**
 * Context provided to all lifecycle hooks
 */
export interface HookContext {
  /** Prisma client for database operations */
  prisma: PrismaClient;

  /** Current authenticated user */
  user?: {
    id: string;
    email: string;
    role: string;
    tenantId?: string;
    isAdmin: boolean;
    [key: string]: any;
  };

  /** Fastify request object */
  request: FastifyRequest;

  /** Custom services registered in the app */
  services: Record<string, any>;

  /** Logger instance */
  logger: {
    info: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    debug: (message: string, ...args: any[]) => void;
  };

  /** Transaction support */
  transaction?: any;
}

/**
 * Lifecycle hooks for model operations
 */
export interface ModelHooks {
  /** Called before creating a new record */
  beforeCreate?: (data: any, context: HookContext) => Promise<any>;

  /** Called after creating a new record */
  afterCreate?: (record: any, context: HookContext) => Promise<void>;

  /** Called before updating a record */
  beforeUpdate?: (id: string, data: any, context: HookContext) => Promise<any>;

  /** Called after updating a record */
  afterUpdate?: (
    record: any,
    previousData: any,
    context: HookContext
  ) => Promise<void>;

  /** Called before deleting a record */
  beforeDelete?: (id: string, context: HookContext) => Promise<void>;

  /** Called after deleting a record */
  afterDelete?: (
    id: string,
    deletedData: any,
    context: HookContext
  ) => Promise<void>;

  /** Called before any find operation */
  beforeFind?: (query: any, context: HookContext) => Promise<any>;

  /** Called after any find operation */
  afterFind?: (results: any[], context: HookContext) => Promise<any[]>;

  /** Custom validation logic */
  validate?: (
    data: any,
    operation: 'create' | 'update',
    context: HookContext
  ) => Promise<void>;
}

/**
 * Model definition with metadata and hooks
 */
export interface ModelDefinition {
  /** Model name (must match Prisma schema) */
  name: string;

  /** Lifecycle hooks */
  hooks?: ModelHooks;

  /** Enable soft deletes (adds deletedAt field) */
  softDelete?: boolean;

  /** Enable audit trails (adds createdBy, updatedBy, deletedBy fields) */
  auditTrail?: boolean;

  /** Model fields definition */
  fields?: Field[];

  /** Model relations definition */
  relations?: Relation[];

  /** API configuration */
  api?: ApiConfig;

  /** Route configuration */
  routes?: Record<string, RouteConfig>;

  /**
   * Map of named functions bound to the model.
   * Used to resolve function references in JSON schema.
   */
  functions?: Record<string, Function>;

  /** Introspected metadata (populated at runtime) */
  metadata?: {
    fields: Array<{
      name: string;
      type: string;
      required: boolean;
      unique: boolean;
      list: boolean;
      kind: 'scalar' | 'object' | 'enum';
    }>;
    relations: Array<{
      name: string;
      model: string;
      type: string;
      kind: 'scalar' | 'object' | 'enum';
    }>;
  };
}

/**
 * Validation error
 */
export class ValidationError extends Error {
  constructor(public errors: Array<{ field: string; message: string }>) {
    super('Validation failed');
    this.name = 'ValidationError';
  }
}

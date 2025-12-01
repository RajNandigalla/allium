import { ModelDefinition, ModelHooks } from './types';
import { modelRegistry } from './model-registry';
import { Field, Relation } from '../types/model';

/**
 * Register a model with optional lifecycle hooks
 *
 * @param name - Model name (must match Prisma schema model name)
 * @param hooks - Optional lifecycle hooks
 * @returns Model definition
 *
 * @example
 * ```typescript
 * // Basic registration
 * export const Product = registerModel('Product');
 *
 * // With named functions
 * export const Product = registerModel('Product', {
 *   functions: {
 *     slugify: async (data, context) => {
 *       data.slug = data.name.toLowerCase().replace(/\s+/g, '-');
 *       return data;
 *     },
 *     logCreation: async (record, context) => {
 *       console.log('Product created:', record.id);
 *     },
 *   },
 * });
 * ```
 */
export interface ModelOptions {
  /**
   * Map of named functions to be bound to the model.
   * These functions can be referenced by name in the JSON schema.
   */
  functions?: Record<string, Function>;
}

/**
 * Register a model with optional configuration
 *
 * @param name - Model name (must match Prisma schema model name)
 * @param options - Configuration object
 * @returns Model definition
 */
export function registerModel(
  name: string,
  options?: ModelOptions
): ModelDefinition {
  const functions = options?.functions || {};

  const model: ModelDefinition = {
    name,
    // Store functions in the model definition so they can be retrieved by the loader
    // We cast to any because ModelDefinition might not strictly include 'functions'
    // depending on which type definition is being used (runtime vs core types),
    // but we added it to runtime/types.ts.
  };

  (model as any).functions = functions;

  modelRegistry.register(model);

  return model;
}

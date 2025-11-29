import { ModelDefinition, ModelHooks } from './types';
import { modelRegistry } from './model-registry';

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
 * // With lifecycle hooks
 * export const Product = registerModel('Product', {
 *   beforeCreate: async (data, context) => {
 *     data.slug = data.name.toLowerCase().replace(/\s+/g, '-');
 *     return data;
 *   },
 *   afterCreate: async (record, context) => {
 *     console.log('Product created:', record.id);
 *   },
 * });
 * ```
 */
export interface ModelOptions {
  hooks?: ModelHooks;
  softDelete?: boolean;
  auditTrail?: boolean;
}

/**
 * Register a model with optional configuration
 *
 * @param name - Model name (must match Prisma schema model name)
 * @param optionsOrHooks - Optional lifecycle hooks or configuration object
 * @returns Model definition
 *
 * @example
 * ```typescript
 * // Basic registration
 * export const Product = registerModel('Product');
 *
 * // With options (recommended)
 * export const Product = registerModel('Product', {
 *   softDelete: true,
 *   auditTrail: true,
 *   hooks: {
 *     beforeCreate: async (data) => { ... }
 *   }
 * });
 *
 * // Legacy: passing hooks directly
 * export const Product = registerModel('Product', {
 *   beforeCreate: async (data) => { ... }
 * });
 * ```
 */
export function registerModel(
  name: string,
  optionsOrHooks?: ModelHooks | ModelOptions
): ModelDefinition {
  let hooks: ModelHooks = {};
  let softDelete = false;
  let auditTrail = false;

  if (optionsOrHooks) {
    // Check if it's the new options object (has hooks, softDelete, or auditTrail properties)
    // or if it's the legacy hooks object (has function properties)
    const isOptions =
      'hooks' in optionsOrHooks ||
      'softDelete' in optionsOrHooks ||
      'auditTrail' in optionsOrHooks;

    if (isOptions) {
      const opts = optionsOrHooks as ModelOptions;
      hooks = opts.hooks || {};
      softDelete = opts.softDelete || false;
      auditTrail = opts.auditTrail || false;
    } else {
      // Legacy: treat as hooks object
      hooks = optionsOrHooks as ModelHooks;
    }
  }

  const model: ModelDefinition = {
    name,
    hooks,
    softDelete,
    auditTrail,
  };

  modelRegistry.register(model);

  return model;
}

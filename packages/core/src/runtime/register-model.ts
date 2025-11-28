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
export function registerModel(
  name: string,
  hooks?: ModelHooks
): ModelDefinition {
  const model: ModelDefinition = {
    name,
    hooks: hooks || {},
  };

  modelRegistry.register(model);

  return model;
}

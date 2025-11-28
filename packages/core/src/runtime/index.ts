// Export main API
export { registerModel } from './register-model';
export { modelRegistry } from './model-registry';
export { SchemaIntrospector } from './schema-introspector';
export { HookExecutor } from './hook-executor';

// Export types
export type { ModelDefinition, ModelHooks, HookContext } from './types';
export { ValidationError } from './types';

// Runtime API
export {
  registerModel,
  modelRegistry,
  SchemaIntrospector,
  HookExecutor,
  ValidationError,
} from './runtime';

export type { ModelDefinition, ModelHooks, HookContext } from './runtime';

// Existing exports (generators, validators, etc.)
export { ModelValidator } from './validators/model-validator';
export { generatePrismaSchema } from './generators/prisma-generator';
export { generateModuleFiles } from './generators/module-generator';
export type {
  AlliumSchema,
  ModelDefinition as OldModelDefinition,
  Field,
  Relation,
} from './types/model';

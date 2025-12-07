// Runtime API
export {
  registerModel,
  modelRegistry,
  SchemaIntrospector,
  HookExecutor,
  ValidationError,
} from './runtime';

export type { ModelDefinition, ModelHooks, HookContext } from './runtime';

// Utilities
export { autoLoadModels, autoLoadModelsSync } from './utils/model-loader';
export { translate } from './utils/translate';
export {
  generateCacheKey,
  generateRecordKey,
  generateListKey,
  generateKeyPattern,
  parseCacheKey,
} from './utils/cache-key-generator';

// Services
export {
  CacheService,
  getCacheService,
  resetCacheService,
} from './services/cache-service';
export type { CacheServiceOptions } from './services/cache-service';

// Built-in models
export { ApiKeyModel, generateApiKey } from './models/apikey';
export { ApiMetricModel } from './models/apimetric';

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

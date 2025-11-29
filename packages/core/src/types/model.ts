export type FieldType =
  | 'String'
  | 'Int'
  | 'Float'
  | 'Boolean'
  | 'DateTime'
  | 'Json'
  | 'Enum';

export interface ValidationRules {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: string[];
}

export interface ComputedFieldConfig {
  // Template-based: "{firstName} {lastName}" or "{address.city}"
  // Supports nested paths using dot notation
  template?: string;

  // Function-based: (record) => record.price * 1.1
  // Only works with registerModel (TypeScript), not JSON
  transform?: (record: any) => any;
}

export type MaskPattern =
  | 'creditCard'
  | 'ssn'
  | 'phone'
  | 'email'
  | { pattern: string; visibleStart?: number; visibleEnd?: number }
  | ((value: any) => any);

export interface Field {
  name: string;
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  default?: string | number | boolean;
  validation?: ValidationRules;
  values?: string[]; // For Enum type fields
  private?: boolean; // If true, field will be excluded from API responses
  masked?: MaskPattern; // Masking configuration
  hasMaskTransform?: boolean; // True when using custom masking function
  jsonSchema?: Record<string, any>; // JSON Schema definition for validation
  encrypted?: boolean; // If true, field will be encrypted at rest
  virtual?: boolean; // Auto-set to true when "computed" is present
  hasTransform?: boolean; // True when using "transform" function
  computed?: ComputedFieldConfig;
}

export type RelationType = '1:1' | '1:n' | 'n:m' | 'polymorphic';

export type OnDeleteAction = 'Cascade' | 'SetNull' | 'NoAction' | 'Restrict';

export interface Relation {
  name: string;
  model?: string; // Optional for polymorphic
  models?: string[]; // Required for polymorphic
  type: RelationType;
  foreignKey?: string;
  references?: string;
  onDelete?: OnDeleteAction;
}

export type ApiOperation = 'create' | 'read' | 'update' | 'delete' | 'list';

export interface RateLimitConfig {
  max: number;
  timeWindow: string | number;
}

export interface ApiConfig {
  prefix?: string;
  version?: string;
  operations?: ApiOperation[];
  rateLimit?: RateLimitConfig;
}

// Route-level configuration
export interface RouteConfig {
  path?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  middleware?: string[];
  rateLimit?: {
    max: number;
    timeWindow: string;
  };
  auth?: boolean | string[];
  customHandler?: string;
}

// Service method configuration
export interface ServiceMethodConfig {
  enabled?: boolean;
  pagination?: boolean;
  softDelete?: boolean;
}

// Service-level configuration
export interface ServiceConfig {
  methods?: {
    [methodName: string]: ServiceMethodConfig;
  };
  hooks?: {
    beforeCreate?: string;
    afterCreate?: string;
    beforeUpdate?: string;
    afterUpdate?: string;
    beforeDelete?: string;
    afterDelete?: string;
  };
  customMethods?: Array<{
    name: string;
    description?: string;
  }>;
}

// Controller-level configuration
export interface ControllerConfig {
  validation?: {
    create?: Record<string, string>;
    update?: Record<string, string>;
  };
  transform?: {
    input?: string;
    output?: string;
  };
  errorHandling?: {
    custom?: boolean;
    handler?: string;
  };
}

// Override detection info
export interface OverrideInfo {
  service?: boolean;
  controller?: boolean;
  routes?: boolean;
  customMethods?: string[];
}

// Model-level constraints
export interface ModelConstraints {
  // Compound unique constraints: [["field1", "field2"], ["field3", "field4"]]
  unique?: string[][];

  // Compound indexes (for future performance optimization)
  indexes?: string[][];
}

export interface ModelDefinition {
  name: string;
  fields: Field[];
  relations?: Relation[];
  api?: ApiConfig;
  routes?: Record<string, RouteConfig>;
  service?: ServiceConfig;
  controller?: ControllerConfig;
  hasOverrides?: OverrideInfo;
  softDelete?: boolean;
  auditTrail?: boolean;
  constraints?: ModelConstraints;
}

export interface AlliumSchema {
  models: ModelDefinition[];
}

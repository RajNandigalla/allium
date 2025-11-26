export type FieldType =
  | 'String'
  | 'Int'
  | 'Float'
  | 'Boolean'
  | 'DateTime'
  | 'Json';

export interface Field {
  name: string;
  type: FieldType;
  required?: boolean;
  unique?: boolean;
  default?: string | number | boolean;
}

export type RelationType = '1:1' | '1:n' | 'n:m';

export interface Relation {
  name: string;
  model: string;
  type: RelationType;
  foreignKey?: string;
  references?: string;
}

export type ApiOperation = 'create' | 'read' | 'update' | 'delete';

export interface ApiConfig {
  prefix?: string;
  operations?: ApiOperation[];
}

export interface ModelDefinition {
  name: string;
  fields: Field[];
  relations?: Relation[];
  api?: ApiConfig;
}

export interface AlliumSchema {
  models: ModelDefinition[];
}

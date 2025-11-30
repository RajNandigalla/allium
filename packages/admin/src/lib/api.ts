const BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:1337/_admin';

export interface ApiError {
  error: string;
}

export interface ValidationRules {
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  enum?: string[];
}

export interface ComputedFieldConfig {
  template?: string;
  transform?: (record: any) => any;
}

export interface ModelField {
  name: string;
  type: string;
  required?: boolean;
  unique?: boolean;
  default?: string | number | boolean;
  validation?: ValidationRules;
  values?: string[];
  private?: boolean;
  writePrivate?: boolean;
  encrypted?: boolean;
  virtual?: boolean;
  computed?: ComputedFieldConfig;
}

export interface Relation {
  name: string;
  model?: string;
  models?: string[];
  type: '1:1' | '1:n' | 'n:m' | 'polymorphic';
  foreignKey?: string;
  references?: string;
  onDelete?: 'Cascade' | 'SetNull' | 'NoAction' | 'Restrict';
  required?: boolean;
}

export interface RateLimitConfig {
  max: number;
  timeWindow: string | number;
}

export interface ApiConfig {
  prefix?: string;
  version?: string;
  operations?: ('create' | 'read' | 'update' | 'delete' | 'list')[];
  rateLimit?: RateLimitConfig;
}

export interface ServiceConfig {
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

export interface ModelConstraints {
  unique?: string[][];
  indexes?: string[][];
}

export interface CreateModelInput {
  name: string;
  description?: string;
  fields: ModelField[];
  relations?: Relation[];
  api?: ApiConfig;
  service?: ServiceConfig;
  softDelete?: boolean;
  auditTrail?: boolean;
  constraints?: ModelConstraints;
}

export interface CreateModelResponse {
  success: boolean;
  model?: any;
  error?: string;
}

export interface SyncResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface ModelDefinition extends CreateModelInput {
  // Model definition includes all create input fields
}

async function fetchAdmin<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;

  // Only set Content-Type header if there's a body
  const headers: HeadersInit = {
    ...options?.headers,
  };

  if (options?.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'An error occurred');
  }

  return data;
}

export const adminApi = {
  createModel: (data: CreateModelInput) =>
    fetchAdmin<CreateModelResponse>('/models', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateModel: (name: string, data: CreateModelInput) =>
    fetchAdmin<CreateModelResponse>(`/models/${name}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  syncSchema: () =>
    fetchAdmin<SyncResponse>('/sync', {
      method: 'POST',
    }),

  getModels: () => fetchAdmin<ModelDefinition[]>('/models'),

  deleteModel: (name: string) =>
    fetchAdmin<{ success: boolean }>(`/models/${name}`, {
      method: 'DELETE',
    }),

  clearModelData: (name: string) =>
    fetchAdmin<{ success: boolean; count: number }>(`/models/${name}/data`, {
      method: 'DELETE',
    }),
};

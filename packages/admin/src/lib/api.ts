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

async function fetchAdmin<T>(
  endpoint: string,
  options?: RequestInit
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
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

  syncSchema: () =>
    fetchAdmin<SyncResponse>('/sync', {
      method: 'POST',
    }),

  getModels: () => fetchAdmin<any[]>('/models'),
};

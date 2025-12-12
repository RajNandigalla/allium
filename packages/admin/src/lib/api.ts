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

export interface AnalyticsOverview {
  totalRequests: number;
  requestsTrend: number;
  avgLatency: number;
  errorRate: number;
}

export interface AnalyticsUsage {
  endpoint: string;
  method: string;
  requests: number;
  avgLatency: number;
}

export interface AnalyticsError {
  id: string;
  statusCode: number;
  method: string;
  endpoint: string;
  timestamp: string;
  errorType?: string;
  errorMessage?: string;
}

export interface AnalyticsChartData {
  date: string;
  requests: number;
  errors: number;
  avgLatency: number;
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
  draftPublish?: boolean;
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
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string>),
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

  // Data Management
  listRecords: (model: string, params?: Record<string, any>) => {
    const query = new URLSearchParams();

    // Add all params to query string
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query.set(key, String(value));
        }
      });
    }

    return fetchAdmin<{
      data: any[];
      meta: { total: number; page: number; limit: number; pages: number };
    }>(`/data/${model}?${query.toString()}`);
  },

  getRecord: (model: string, id: string) =>
    fetchAdmin<{ data: any }>(`/data/${model}/${id}`),

  createRecord: (model: string, data: any) =>
    fetchAdmin<{ success: boolean; data: any }>(`/data/${model}`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateRecord: (model: string, id: string, data: any) =>
    fetchAdmin<{ success: boolean; data: any }>(`/data/${model}/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteRecord: (model: string, id: string) =>
    fetchAdmin<{ success: boolean; message: string }>(`/data/${model}/${id}`, {
      method: 'DELETE',
    }),

  // API Keys Management
  listApiKeys: () =>
    fetchAdmin<
      Array<{
        id: string;
        name: string;
        key: string;
        service: string;
        isActive: boolean;
        expiresAt: string | null;
        lastUsedAt: string | null;
        createdAt: string;
        updatedAt: string;
      }>
    >('/api-keys'),

  generateApiKey: (data: {
    name: string;
    service: string;
    expiresAt?: string;
  }) =>
    fetchAdmin<{
      success: boolean;
      apiKey: {
        id: string;
        name: string;
        key: string;
        service: string;
        isActive: boolean;
        expiresAt: string | null;
        createdAt: string;
      };
    }>('/api-keys', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  revokeApiKey: (id: string) =>
    fetchAdmin<{ success: boolean; message: string }>(`/api-keys/${id}`, {
      method: 'DELETE',
    }),

  // System Information
  getSystemInfo: () =>
    fetchAdmin<{
      os: {
        platform: string;
        release: string;
        type: string;
        arch: string;
        cpus: number;
        totalMem: number;
        freeMem: number;
      };
      node: {
        version: string;
        env: string;
        uptime: number;
        memoryUsage: {
          rss: number;
          heapTotal: number;
          heapUsed: number;
          external: number;
        };
      };
    }>('/system/info'),

  // Project Configuration
  getConfig: () =>
    fetchAdmin<{
      name: string;
      version: string;
      root: string;
    }>('/config'),

  // Model Import/Export
  importModels: (
    models: ModelDefinition[],
    strategy: 'skip' | 'overwrite' = 'skip'
  ) =>
    fetchAdmin<{
      success: boolean;
      imported: number;
      skipped: number;
      errors: Array<{ name: string; error: string }>;
    }>('/models/import', {
      method: 'POST',
      body: JSON.stringify({ models, strategy }),
    }),

  // Analytics
  getAnalyticsOverview: (range: string = '24h', from?: string, to?: string) => {
    const query = new URLSearchParams({ range });
    if (from) query.set('from', from);
    if (to) query.set('to', to);
    return fetchAdmin<AnalyticsOverview>(`/analytics/overview?${query}`);
  },

  getAnalyticsUsage: (range: string = '24h', from?: string, to?: string) => {
    const query = new URLSearchParams({ range });
    if (from) query.set('from', from);
    if (to) query.set('to', to);
    return fetchAdmin<AnalyticsUsage[]>(`/analytics/usage?${query}`);
  },

  getAnalyticsErrors: (range: string = '24h', from?: string, to?: string) => {
    const query = new URLSearchParams({ range });
    if (from) query.set('from', from);
    if (to) query.set('to', to);
    return fetchAdmin<AnalyticsError[]>(`/analytics/errors?${query}`);
  },

  getAnalyticsChart: (range: string = '24h', from?: string, to?: string) => {
    const query = new URLSearchParams({ range });
    if (from) query.set('from', from);
    if (to) query.set('to', to);
    return fetchAdmin<AnalyticsChartData[]>(`/analytics/chart?${query}`);
  },

  // Webhooks
  listWebhooks: () =>
    fetchAdmin<
      Array<{
        name: string;
        url: string;
        events: string[];
        active: boolean;
        secret?: string;
      }>
    >('/webhooks'),

  getWebhook: (name: string) =>
    fetchAdmin<{
      name: string;
      url: string;
      events: string[];
      active: boolean;
      secret?: string;
    }>(`/webhooks/${name}`),

  createWebhook: (data: {
    name: string;
    url: string;
    events: string[];
    active: boolean;
    secret?: string;
  }) =>
    fetchAdmin<{ success: boolean; webhook: any }>('/webhooks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateWebhook: (
    name: string,
    data: {
      name: string;
      url: string;
      events: string[];
      active: boolean;
      secret?: string;
    }
  ) =>
    fetchAdmin<{ success: boolean; webhook: any }>(`/webhooks/${name}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteWebhook: (name: string) =>
    fetchAdmin<{ success: boolean }>(`/webhooks/${name}`, {
      method: 'DELETE',
    }),

  // Cron Jobs
  listCronJobs: () =>
    fetchAdmin<
      Array<{
        name: string;
        schedule: string;
        endpoint: string;
        method: string;
        active: boolean;
      }>
    >('/cronjobs'),

  getCronJob: (name: string) =>
    fetchAdmin<{
      name: string;
      schedule: string;
      endpoint: string;
      method: string;
      active: boolean;
    }>(`/cronjobs/${name}`),

  createCronJob: (data: {
    name: string;
    schedule: string;
    endpoint: string;
    method: string;
    active: boolean;
  }) =>
    fetchAdmin<{ success: boolean; cronjob: any }>('/cronjobs', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateCronJob: (
    name: string,
    data: {
      name: string;
      schedule: string;
      endpoint: string;
      method: string;
      active: boolean;
    }
  ) =>
    fetchAdmin<{ success: boolean; cronjob: any }>(`/cronjobs/${name}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteCronJob: (name: string) =>
    fetchAdmin<{ success: boolean }>(`/cronjobs/${name}`, {
      method: 'DELETE',
    }),
};

const BASE_URL =
  process.env.NEXT_PUBLIC_ADMIN_API_URL || 'http://localhost:1337/_admin';

export interface ApiError {
  error: string;
}

export interface ModelField {
  name: string;
  type: string;
  required: boolean;
  unique: boolean;
}

export interface CreateModelInput {
  name: string;
  fields: ModelField[];
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

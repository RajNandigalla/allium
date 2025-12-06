/**
 * Utility for generating consistent cache keys
 */

export interface CacheKeyOptions {
  model: string;
  operation?: 'list' | 'get' | 'count';
  id?: string | number;
  filters?: Record<string, any>;
  sort?: Record<string, 'asc' | 'desc'>;
  page?: number;
  limit?: number;
}

/**
 * Generate a consistent cache key for model operations
 */
export function generateCacheKey(options: CacheKeyOptions): string {
  const parts: string[] = [options.model];

  if (options.operation) {
    parts.push(options.operation);
  }

  if (options.id !== undefined) {
    parts.push(String(options.id));
  }

  // Add filters to key
  if (options.filters && Object.keys(options.filters).length > 0) {
    const filterStr = JSON.stringify(sortObject(options.filters));
    const filterHash = simpleHash(filterStr);
    parts.push(`f:${filterHash}`);
  }

  // Add sorting to key
  if (options.sort && Object.keys(options.sort).length > 0) {
    const sortStr = JSON.stringify(sortObject(options.sort));
    const sortHash = simpleHash(sortStr);
    parts.push(`s:${sortHash}`);
  }

  // Add pagination to key
  if (options.page !== undefined) {
    parts.push(`p:${options.page}`);
  }

  if (options.limit !== undefined) {
    parts.push(`l:${options.limit}`);
  }

  return parts.join(':');
}

/**
 * Generate cache key for a specific record
 */
export function generateRecordKey(model: string, id: string | number): string {
  return `${model}:get:${id}`;
}

/**
 * Generate cache key for list operations
 */
export function generateListKey(
  model: string,
  filters?: Record<string, any>,
  sort?: Record<string, 'asc' | 'desc'>,
  page?: number,
  limit?: number
): string {
  return generateCacheKey({
    model,
    operation: 'list',
    filters,
    sort,
    page,
    limit,
  });
}

/**
 * Generate cache key pattern for invalidation
 * Example: 'user:*' to invalidate all user-related keys
 */
export function generateKeyPattern(model: string, operation?: string): string {
  if (operation) {
    return `${model}:${operation}:*`;
  }
  return `${model}:*`;
}

/**
 * Sort object keys recursively for consistent hashing
 */
function sortObject(obj: any): any {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(sortObject);
  }

  const sorted: Record<string, any> = {};
  Object.keys(obj)
    .sort()
    .forEach((key) => {
      sorted[key] = sortObject(obj[key]);
    });

  return sorted;
}

/**
 * Simple hash function for generating short cache key segments
 */
function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Parse cache key back into components (for debugging)
 */
export function parseCacheKey(key: string): {
  model: string;
  operation?: string;
  id?: string;
  hasFilters: boolean;
  hasSort: boolean;
  page?: number;
  limit?: number;
} {
  const parts = key.split(':');
  const result: any = {
    model: parts[0],
    hasFilters: false,
    hasSort: false,
  };

  for (let i = 1; i < parts.length; i++) {
    const part = parts[i];

    if (part === 'list' || part === 'get' || part === 'count') {
      result.operation = part;
    } else if (part.startsWith('f:')) {
      result.hasFilters = true;
    } else if (part.startsWith('s:')) {
      result.hasSort = true;
    } else if (part.startsWith('p:')) {
      result.page = parseInt(part.substring(2), 10);
    } else if (part.startsWith('l:')) {
      result.limit = parseInt(part.substring(2), 10);
    } else if (!isNaN(Number(part))) {
      result.id = part;
    }
  }

  return result;
}

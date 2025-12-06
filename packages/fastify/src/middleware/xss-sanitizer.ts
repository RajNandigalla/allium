import { FastifyRequest } from 'fastify';
import xss from 'xss';

export interface XSSSanitizerOptions {
  /**
   * Enable XSS sanitization
   * @default false
   */
  enabled?: boolean;

  /**
   * Custom whitelist for allowed HTML tags
   * @see https://github.com/leizongmin/js-xss#whitelist
   */
  whiteList?: Record<string, string[]>;

  /**
   * Routes that are exempt from XSS sanitization
   * Supports glob patterns (e.g., '/api/content/*')
   */
  exemptRoutes?: string[];

  /**
   * Field names that are exempt from XSS sanitization
   * Useful for fields that legitimately contain HTML (e.g., 'htmlContent', 'richText')
   */
  exemptFields?: string[];
}

/**
 * Sanitize a value recursively
 * - Strings are sanitized for XSS
 * - Objects and arrays are recursively processed
 * - Other types (numbers, booleans, null) are preserved
 */
function sanitizeValue(
  value: any,
  exemptFields: Set<string>,
  fieldName?: string,
  xssOptions?: any
): any {
  // Check if this field is exempt
  if (fieldName && exemptFields.has(fieldName)) {
    return value;
  }

  // Handle null and undefined
  if (value === null || value === undefined) {
    return value;
  }

  // Handle strings - sanitize for XSS
  if (typeof value === 'string') {
    return xssOptions ? xss(value, xssOptions) : xss(value);
  }

  // Handle arrays - recursively sanitize each element
  if (Array.isArray(value)) {
    return value.map((item) =>
      sanitizeValue(item, exemptFields, undefined, xssOptions)
    );
  }

  // Handle objects - recursively sanitize each property
  if (typeof value === 'object') {
    const sanitized: Record<string, any> = {};
    for (const [key, val] of Object.entries(value)) {
      sanitized[key] = sanitizeValue(val, exemptFields, key, xssOptions);
    }
    return sanitized;
  }

  // Preserve other types (numbers, booleans, etc.)
  return value;
}

/**
 * Check if a route matches any pattern in the exempt list
 */
function isRouteExempt(url: string, exemptRoutes: string[]): boolean {
  for (const pattern of exemptRoutes) {
    // Simple glob pattern matching
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    if (regex.test(url)) {
      return true;
    }
  }
  return false;
}

/**
 * XSS sanitization middleware
 * Sanitizes request body, query parameters, and route parameters
 */
export function createXSSSanitizer(options: XSSSanitizerOptions = {}) {
  const {
    enabled = false,
    whiteList,
    exemptRoutes = [],
    exemptFields = [],
  } = options;

  // If not enabled, return a no-op middleware
  if (!enabled) {
    return async (request: FastifyRequest) => {
      // No-op
    };
  }

  // Create XSS instance with custom whitelist if provided
  const xssOptions = whiteList ? { whiteList } : undefined;
  const exemptFieldsSet = new Set(exemptFields);

  return async (request: FastifyRequest) => {
    // Check if route is exempt
    if (isRouteExempt(request.url, exemptRoutes)) {
      return;
    }

    // Sanitize request body
    if (request.body) {
      request.body = sanitizeValue(
        request.body,
        exemptFieldsSet,
        undefined,
        xssOptions
      );
    }

    // Sanitize query parameters
    if (request.query) {
      request.query = sanitizeValue(
        request.query,
        exemptFieldsSet,
        undefined,
        xssOptions
      );
    }

    // Sanitize route parameters
    if (request.params) {
      request.params = sanitizeValue(
        request.params,
        exemptFieldsSet,
        undefined,
        xssOptions
      );
    }
  };
}

import { FastifyRequest } from 'fastify';

export interface SQLInjectionGuardOptions {
  /**
   * Enable SQL injection detection
   * @default false
   */
  enabled?: boolean;

  /**
   * Log suspicious activity but don't block requests
   * Useful for testing and monitoring
   * @default false
   */
  logOnly?: boolean;

  /**
   * Routes that are exempt from SQL injection detection
   */
  exemptRoutes?: string[];
}

/**
 * Common SQL injection patterns to detect
 */
const SQL_INJECTION_PATTERNS = [
  // SQL keywords in suspicious contexts
  /(\b(union|select|insert|update|delete|drop|create|alter|exec|execute|script|javascript|eval)\b)/gi,

  // SQL comments
  /(--|\/\*|\*\/|#)/g,

  // Stacked queries
  /;\s*(select|insert|update|delete|drop|create|alter)/gi,

  // SQL string concatenation attempts
  /(\|\||concat\s*\()/gi,

  // Hex encoding attempts
  /(0x[0-9a-f]+)/gi,

  // SQL functions that might be dangerous
  /\b(sleep|benchmark|waitfor|delay)\s*\(/gi,
];

/**
 * Strapi-style filter operators that are allowed
 */
const ALLOWED_FILTER_OPERATORS = new Set([
  '$eq',
  '$ne',
  '$gt',
  '$gte',
  '$lt',
  '$lte',
  '$contains',
  '$startsWith',
  '$endsWith',
  '$in',
  '$notIn',
  '$null',
  '$notNull',
  '$between',
  '$and',
  '$or',
  '$not',
]);

/**
 * Check if a value contains potential SQL injection patterns
 */
function containsSQLInjection(value: any): boolean {
  if (typeof value !== 'string') {
    return false;
  }

  // Check against known patterns
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(value)) {
      return true;
    }
  }

  return false;
}

/**
 * Recursively check an object for SQL injection patterns
 */
function checkObjectForSQLInjection(
  obj: any,
  path: string = ''
): string | null {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (typeof obj === 'string') {
    if (containsSQLInjection(obj)) {
      return path || 'value';
    }
    return null;
  }

  if (Array.isArray(obj)) {
    for (let i = 0; i < obj.length; i++) {
      const result = checkObjectForSQLInjection(obj[i], `${path}[${i}]`);
      if (result) return result;
    }
    return null;
  }

  if (typeof obj === 'object') {
    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      // Validate filter operators
      if (key.startsWith('$') && !ALLOWED_FILTER_OPERATORS.has(key)) {
        return `${currentPath} (invalid operator)`;
      }

      const result = checkObjectForSQLInjection(value, currentPath);
      if (result) return result;
    }
    return null;
  }

  return null;
}

/**
 * Check if a route matches any pattern in the exempt list
 */
function isRouteExempt(url: string, exemptRoutes: string[]): boolean {
  for (const pattern of exemptRoutes) {
    const regexPattern = pattern.replace(/\*/g, '.*').replace(/\?/g, '.');
    const regex = new RegExp(`^${regexPattern}$`);
    if (regex.test(url)) {
      return true;
    }
  }
  return false;
}

/**
 * SQL injection detection middleware
 *
 * Note: This is a defense-in-depth measure. Prisma already provides
 * parameterized queries which prevent SQL injection. This middleware
 * adds an additional layer of protection and logging.
 */
export function createSQLInjectionGuard(
  options: SQLInjectionGuardOptions = {}
) {
  const { enabled = false, logOnly = false, exemptRoutes = [] } = options;

  // If not enabled, return a no-op middleware
  if (!enabled) {
    return async (request: FastifyRequest) => {
      // No-op
    };
  }

  return async (request: FastifyRequest) => {
    // Check if route is exempt
    if (isRouteExempt(request.url, exemptRoutes)) {
      return;
    }

    // Check request body
    if (request.body) {
      const suspiciousField = checkObjectForSQLInjection(request.body, 'body');
      if (suspiciousField) {
        const message = `Potential SQL injection detected in ${suspiciousField}`;
        request.log.warn(
          {
            url: request.url,
            method: request.method,
            field: suspiciousField,
            ip: request.ip,
          },
          message
        );

        if (!logOnly) {
          throw request.server.httpErrors.badRequest(
            'Invalid input: potential security violation detected'
          );
        }
      }
    }

    // Check query parameters
    if (request.query) {
      const suspiciousField = checkObjectForSQLInjection(
        request.query,
        'query'
      );
      if (suspiciousField) {
        const message = `Potential SQL injection detected in ${suspiciousField}`;
        request.log.warn(
          {
            url: request.url,
            method: request.method,
            field: suspiciousField,
            ip: request.ip,
          },
          message
        );

        if (!logOnly) {
          throw request.server.httpErrors.badRequest(
            'Invalid input: potential security violation detected'
          );
        }
      }
    }

    // Check route parameters
    if (request.params) {
      const suspiciousField = checkObjectForSQLInjection(
        request.params,
        'params'
      );
      if (suspiciousField) {
        const message = `Potential SQL injection detected in ${suspiciousField}`;
        request.log.warn(
          {
            url: request.url,
            method: request.method,
            field: suspiciousField,
            ip: request.ip,
          },
          message
        );

        if (!logOnly) {
          throw request.server.httpErrors.badRequest(
            'Invalid input: potential security violation detected'
          );
        }
      }
    }
  };
}

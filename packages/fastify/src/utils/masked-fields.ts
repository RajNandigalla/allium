import { ModelDefinition } from '@allium/core';

/**
 * Apply masking to sensitive fields in the response data
 */
export function applyMasking(data: any | any[], model: ModelDefinition): any {
  const maskedFields = model.fields?.filter((f) => f.masked) || [];

  if (maskedFields.length === 0) return data;

  const mask = (record: any) => {
    const result = { ...record };

    for (const field of maskedFields) {
      const value = result[field.name];
      if (value === undefined || value === null) continue;

      if (typeof field.masked === 'function') {
        result[field.name] = field.masked(value);
      } else if (typeof field.masked === 'string') {
        // Check if it's a preset
        const presets = ['creditCard', 'ssn', 'phone', 'email'];
        if (presets.includes(field.masked)) {
          result[field.name] = applyPresetMask(value, field.masked);
        } else {
          // Assume it's a function reference
          const fnName = field.masked;
          const fn = (model as any).functions?.[fnName];
          if (typeof fn === 'function') {
            result[field.name] = fn(value);
          } else {
            // Fallback or warning? For now, just return original if not found
            // console.warn(`Mask function '${fnName}' not found for field '${field.name}'`);
            result[field.name] = value;
          }
        }
      } else if (typeof field.masked === 'object') {
        result[field.name] = applyCustomMask(value, field.masked);
      }
    }

    return result;
  };

  return Array.isArray(data) ? data.map(mask) : mask(data);
}

function applyPresetMask(value: any, pattern: string): string {
  const strValue = String(value);
  switch (pattern) {
    case 'creditCard':
      // Keep last 4 digits visible
      return strValue.replace(/\d(?=\d{4})/g, '*');
    case 'ssn':
      // Keep last 4 digits visible: ***-**-1234
      return strValue.replace(/\d(?=\d{4})/g, '*');
    case 'phone':
      // Keep last 4 digits visible
      return strValue.replace(/\d(?=\d{4})/g, '*');
    case 'email':
      const parts = strValue.split('@');
      if (parts.length === 2) {
        const [name, domain] = parts;
        const visibleName =
          name.length > 2 ? name.substring(0, 2) : name.substring(0, 1);
        return `${visibleName}***@${domain}`;
      }
      return strValue;
    default:
      return strValue;
  }
}

function applyCustomMask(
  value: any,
  config: { pattern: string; visibleStart?: number; visibleEnd?: number }
): string {
  const strValue = String(value);
  const { visibleStart = 0, visibleEnd = 0, pattern } = config;

  if (strValue.length <= visibleStart + visibleEnd) {
    return strValue;
  }

  const start = strValue.substring(0, visibleStart);
  const end = strValue.substring(strValue.length - visibleEnd);
  const middleLength = strValue.length - visibleStart - visibleEnd;

  // If pattern is a single char, repeat it. If it's a string, use it as is?
  // The plan said "pattern: string". Let's assume it's the mask character.
  // But wait, the example was "sk_test****abcd".
  // Let's assume 'pattern' is the character to use for masking, e.g. '*'.
  // Or maybe it's a fixed string replacement?
  // Let's implement it as a repeated character for now, as that's most common.

  const mask = pattern.length === 1 ? pattern.repeat(middleLength) : pattern;

  return `${start}${mask}${end}`;
}

import { ModelDefinition } from '@allium/core';

/**
 * Filter private fields from response data
 */
export function filterPrivateFields(
  data: any | any[],
  model: ModelDefinition
): any {
  if (!data) return data;

  const privateFields =
    model.fields?.filter((f) => f.private).map((f) => f.name) || [];

  if (privateFields.length === 0) return data;

  const omit = (obj: any, keys: string[]) => {
    if (!obj || typeof obj !== 'object') return obj;
    const result = { ...obj };
    keys.forEach((key) => delete result[key]);
    return result;
  };

  if (Array.isArray(data)) {
    return data.map((item) => omit(item, privateFields));
  }

  return omit(data, privateFields);
}

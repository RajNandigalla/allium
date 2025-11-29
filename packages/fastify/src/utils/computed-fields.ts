import { get } from 'lodash';
import { ModelDefinition, translate } from '@allium/core';

/**
 * Add computed/virtual fields to response data
 */
export function addComputedFields(
  data: any | any[],
  model: ModelDefinition
): any {
  const computedFields = model.fields?.filter((f) => f.computed) || [];

  if (computedFields.length === 0) return data;

  const compute = (record: any) => {
    const result = { ...record };

    for (const field of computedFields) {
      const { template, transform } = field.computed || {};

      // Validation: Only one computation method allowed
      if (template && transform) {
        throw new Error(
          `Field "${field.name}": Cannot use both 'template' and 'transform'. Choose one.`
        );
      }

      // Template-based computation
      if (template) {
        const templateData: Record<string, any> = {};
        const matches = template.match(/\{([\w.]+)\}/g) || [];

        matches.forEach((match) => {
          const path = match.slice(1, -1); // Remove { }
          templateData[path] = get(record, path, '');
        });

        result[field.name] = translate(template, templateData);
      } else if (transform) {
        // Function-based computation
        result[field.name] = transform(record);
      }
    }

    return result;
  };

  return Array.isArray(data) ? data.map(compute) : compute(data);
}

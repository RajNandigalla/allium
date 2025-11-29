import { ModelDefinition, HookContext, ValidationError } from './types';

/**
 * Executes lifecycle hooks for model operations
 */
export class HookExecutor {
  /**
   * Validate data against model field rules
   */
  private validateFields(model: ModelDefinition, data: any): void {
    const errors: Array<{ field: string; message: string }> = [];

    if (!model.fields) {
      return;
    }

    for (const field of model.fields) {
      const value = data[field.name];

      // Skip validation if value is undefined/null
      if (value === undefined || value === null) {
        continue;
      }

      // Enum type validation (check this BEFORE rules check, since enums use field.values not field.validation)
      if (field.type === 'Enum') {
        if (field.values) {
          if (typeof value === 'string') {
            if (!field.values.includes(value)) {
              errors.push({
                field: field.name,
                message: `Value must be one of: ${field.values.join(', ')}`,
              });
            }
          }
        }
      }

      const rules = field.validation;
      if (!rules) continue;

      // Min/Max (Numbers)
      if (typeof value === 'number') {
        if (rules?.min !== undefined && value < rules.min) {
          errors.push({
            field: field.name,
            message: `Value must be at least ${rules.min}`,
          });
        }
        if (rules?.max !== undefined && value > rules.max) {
          errors.push({
            field: field.name,
            message: `Value must be at most ${rules.max}`,
          });
        }
      }

      // MinLength/MaxLength/Pattern (Strings)
      if (typeof value === 'string') {
        if (rules?.minLength !== undefined && value.length < rules.minLength) {
          errors.push({
            field: field.name,
            message: `Length must be at least ${rules.minLength} characters`,
          });
        }
        if (rules?.maxLength !== undefined && value.length > rules.maxLength) {
          errors.push({
            field: field.name,
            message: `Length must be at most ${rules.maxLength} characters`,
          });
        }
        if (rules?.pattern !== undefined) {
          const regex = new RegExp(rules.pattern);
          if (!regex.test(value)) {
            errors.push({
              field: field.name,
              message: `Value does not match required pattern`,
            });
          }
        }
        if (rules?.enum !== undefined && !rules.enum.includes(value)) {
          errors.push({
            field: field.name,
            message: `Value must be one of: ${rules.enum.join(', ')}`,
          });
        }
      }
    }

    if (errors.length > 0) {
      throw new ValidationError(errors);
    }
  }

  /**
   * Execute beforeCreate and validate hooks
   */
  async executeBeforeCreate(
    model: ModelDefinition,
    data: any,
    context: HookContext
  ): Promise<any> {
    // Apply default values for missing fields
    if (model.fields) {
      for (const field of model.fields) {
        if (field.default !== undefined && data[field.name] === undefined) {
          // Apply default value as-is; transformation will handle uppercasing for enums
          data[field.name] = field.default;
        }
      }
    }

    // Run field validation (before transforming enums)
    this.validateFields(model, data);

    // Transform enum values to uppercase for Prisma compatibility (after validation)
    if (model.fields) {
      for (const field of model.fields) {
        if (
          field.type === 'Enum' &&
          data[field.name] !== undefined &&
          typeof data[field.name] === 'string'
        ) {
          data[field.name] = data[field.name].toUpperCase();
        }
      }
    }

    // Auto-populate audit fields
    if (model.auditTrail && context.user?.id) {
      data.createdBy = context.user.id;
      data.updatedBy = context.user.id;
    }

    // Run validation hook first
    if (model.hooks?.validate) {
      try {
        await model.hooks.validate(data, 'create', context);
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error;
        }
        throw new ValidationError([
          { field: '_general', message: (error as Error).message },
        ]);
      }
    }

    // Run beforeCreate hook
    if (model.hooks?.beforeCreate) {
      const modifiedData = await model.hooks.beforeCreate(data, context);
      return modifiedData !== undefined ? modifiedData : data;
    }

    return data;
  }

  /**
   * Execute afterCreate hook
   */
  async executeAfterCreate(
    model: ModelDefinition,
    record: any,
    context: HookContext
  ): Promise<void> {
    if (model.hooks?.afterCreate) {
      await model.hooks.afterCreate(record, context);
    }
  }

  /**
   * Execute beforeUpdate and validate hooks
   */
  async executeBeforeUpdate(
    model: ModelDefinition,
    id: string,
    data: any,
    context: HookContext
  ): Promise<any> {
    // Run field validation
    this.validateFields(model, data);

    // Auto-populate audit fields
    if (model.auditTrail && context.user?.id) {
      data.updatedBy = context.user.id;
    }

    // Run validation hook first
    if (model.hooks?.validate) {
      try {
        await model.hooks.validate(data, 'update', context);
      } catch (error) {
        if (error instanceof ValidationError) {
          throw error;
        }
        throw new ValidationError([
          { field: '_general', message: (error as Error).message },
        ]);
      }
    }

    // Run beforeUpdate hook
    if (model.hooks?.beforeUpdate) {
      const modifiedData = await model.hooks.beforeUpdate(id, data, context);
      return modifiedData !== undefined ? modifiedData : data;
    }

    return data;
  }

  /**
   * Execute afterUpdate hook
   */
  async executeAfterUpdate(
    model: ModelDefinition,
    record: any,
    previousData: any,
    context: HookContext
  ): Promise<void> {
    if (model.hooks?.afterUpdate) {
      await model.hooks.afterUpdate(record, previousData, context);
    }
  }

  /**
   * Execute beforeDelete hook
   */
  async executeBeforeDelete(
    model: ModelDefinition,
    id: string,
    context: HookContext
  ): Promise<void> {
    if (model.hooks?.beforeDelete) {
      await model.hooks.beforeDelete(id, context);
    }
  }

  /**
   * Execute afterDelete hook
   */
  async executeAfterDelete(
    model: ModelDefinition,
    id: string,
    deletedData: any,
    context: HookContext
  ): Promise<void> {
    if (model.hooks?.afterDelete) {
      await model.hooks.afterDelete(id, deletedData, context);
    }
  }

  /**
   * Execute beforeFind hook
   */
  async executeBeforeFind(
    model: ModelDefinition,
    query: any,
    context: HookContext
  ): Promise<any> {
    // Filter soft deleted records
    if (model.softDelete) {
      // Check if we should include deleted records (e.g. via query param or context)
      // For now, we assume query might have a special flag, or we default to excluding
      const includeDeleted = query.where?.deletedAt !== undefined;

      if (!includeDeleted) {
        query.where = {
          ...query.where,
          deletedAt: null,
        };
      }
    }

    if (model.hooks?.beforeFind) {
      const modifiedQuery = await model.hooks.beforeFind(query, context);
      return modifiedQuery !== undefined ? modifiedQuery : query;
    }

    return query;
  }

  /**
   * Execute afterFind hook
   */
  async executeAfterFind(
    model: ModelDefinition,
    results: any[],
    context: HookContext
  ): Promise<any[]> {
    if (model.hooks?.afterFind) {
      const modifiedResults = await model.hooks.afterFind(results, context);
      return modifiedResults !== undefined ? modifiedResults : results;
    }

    return results;
  }
}

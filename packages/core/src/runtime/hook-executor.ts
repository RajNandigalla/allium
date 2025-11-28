import { ModelDefinition, HookContext, ValidationError } from './types';

/**
 * Executes lifecycle hooks for model operations
 */
export class HookExecutor {
  /**
   * Execute beforeCreate and validate hooks
   */
  async executeBeforeCreate(
    model: ModelDefinition,
    data: any,
    context: HookContext
  ): Promise<any> {
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

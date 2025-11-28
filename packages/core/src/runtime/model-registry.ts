import { ModelDefinition } from './types';

/**
 * Global registry for all registered models
 */
class ModelRegistry {
  private models: Map<string, ModelDefinition> = new Map();

  /**
   * Register a model definition
   */
  register(model: ModelDefinition): void {
    if (this.models.has(model.name)) {
      throw new Error(`Model ${model.name} is already registered`);
    }
    this.models.set(model.name, model);
  }

  /**
   * Get a model by name
   */
  get(name: string): ModelDefinition | undefined {
    return this.models.get(name);
  }

  /**
   * Get all registered models
   */
  getAll(): ModelDefinition[] {
    return Array.from(this.models.values());
  }

  /**
   * Check if a model is registered
   */
  has(name: string): boolean {
    return this.models.has(name);
  }

  /**
   * Clear all registered models (useful for testing)
   */
  clear(): void {
    this.models.clear();
  }

  /**
   * Get model names
   */
  getNames(): string[] {
    return Array.from(this.models.keys());
  }
}

// Export singleton instance
export const modelRegistry = new ModelRegistry();

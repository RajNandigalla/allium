import fs from 'fs';
import path from 'path';
import { ModelDefinition } from '../types/model';

/**
 * Automatically load all model files from the src/models directory
 * @param modelsDir - Absolute path to the models directory (usually path.join(__dirname, 'models'))
 * @returns Array of ModelDefinition objects
 */
export async function autoLoadModels(
  modelsDir: string
): Promise<ModelDefinition[]> {
  const models: ModelDefinition[] = [];

  if (!fs.existsSync(modelsDir)) {
    console.warn(`Models directory not found: ${modelsDir}`);
    return models;
  }

  const files = fs.readdirSync(modelsDir);
  const modelFiles = files.filter(
    (file) => file.endsWith('.model.ts') || file.endsWith('.model.js')
  );

  for (const file of modelFiles) {
    try {
      const filePath = path.join(modelsDir, file);
      const module = await import(filePath);

      // Find the exported model (it should be a ModelDefinition)
      const exportedModel = Object.values(module).find(
        (exp: any) => exp && typeof exp === 'object' && exp.name && exp.metadata
      );

      if (exportedModel) {
        models.push(exportedModel as ModelDefinition);
      }
    } catch (error) {
      console.error(`Failed to load model from ${file}:`, error);
    }
  }

  return models;
}

/**
 * Synchronously load all model files from the src/models directory
 * Useful when dynamic imports are not available
 * @param modelsDir - Absolute path to the models directory
 * @returns Array of ModelDefinition objects
 */
export function autoLoadModelsSync(modelsDir: string): ModelDefinition[] {
  const models: ModelDefinition[] = [];

  if (!fs.existsSync(modelsDir)) {
    console.warn(`Models directory not found: ${modelsDir}`);
    return models;
  }

  const files = fs.readdirSync(modelsDir);
  const modelFiles = files.filter(
    (file) => file.endsWith('.model.ts') || file.endsWith('.model.js')
  );

  for (const file of modelFiles) {
    try {
      const filePath = path.join(modelsDir, file);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const module = require(filePath);

      // Find the exported model
      const exportedModel = Object.values(module).find(
        (exp: any) => exp && typeof exp === 'object' && exp.name && exp.metadata
      );

      if (exportedModel) {
        models.push(exportedModel as ModelDefinition);
      }
    } catch (error) {
      console.error(`Failed to load model from ${file}:`, error);
    }
  }

  return models;
}

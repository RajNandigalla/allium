import fs from 'fs';
import path from 'path';
import { ModelDefinition } from '../runtime/types';

/**
 * Automatically load all model files from the src/models directory
 * @param modelsDir - Absolute path to the models directory (usually path.join(__dirname, 'models'))
 * @returns Array of ModelDefinition objects
 */
export async function autoLoadModels(
  modelsDir: string
): Promise<ModelDefinition[]> {
  const models: ModelDefinition[] = [];

  console.log('[autoLoadModels] Starting model loading from:', modelsDir);

  if (!fs.existsSync(modelsDir)) {
    console.warn(`Models directory not found: ${modelsDir}`);
    return models;
  }

  // 1. Load all TS model files to get the code implementations (functions)
  const codeModels = new Map<string, any>();
  const files = fs.readdirSync(modelsDir);
  const modelFiles = files.filter(
    (file) => file.endsWith('.model.ts') || file.endsWith('.model.js')
  );

  for (const file of modelFiles) {
    try {
      const filePath = path.join(modelsDir, file);
      const module = await import(filePath);

      // Find the exported model
      const exportedModel = Object.values(module).find(
        (exp: any) => exp && typeof exp === 'object' && exp.name
      );

      if (exportedModel) {
        codeModels.set((exportedModel as any).name, exportedModel);
      }
    } catch (error) {
      console.error(`Failed to load model from ${file}:`, error);
    }
  }

  // 2. Load schema.json (Source of Truth for structure)
  let schema: any = null;
  try {
    const projectRoot = path.resolve(modelsDir, '../..');
    const schemaPath = path.join(projectRoot, '.allium', 'schema.json');

    if (fs.existsSync(schemaPath)) {
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      schema = JSON.parse(schemaContent);
      console.log(
        '[autoLoadModels] Loaded schema with',
        schema.models?.length || 0,
        'models'
      );
    }
  } catch (error) {
    console.error('[autoLoadModels] Error loading schema:', error);
  }

  // 3. Hydrate models
  if (schema) {
    for (const schemaModel of schema.models) {
      const codeModel = codeModels.get(schemaModel.name);
      const functions = codeModel?.functions || {};

      const model: ModelDefinition = {
        ...schemaModel,
        // We also attach the functions map for reference
        functions: functions,
      };

      models.push(model);
    }
  } else {
    // Fallback: if no schema, return code models
    for (const codeModel of codeModels.values()) {
      models.push(codeModel);
    }
  }

  return models;
}

export function autoLoadModelsSync(modelsDir: string): ModelDefinition[] {
  // Sync implementation similar to async
  const models: ModelDefinition[] = [];
  if (!fs.existsSync(modelsDir)) return models;

  const codeModels = new Map<string, any>();
  const files = fs.readdirSync(modelsDir);
  const modelFiles = files.filter(
    (file) => file.endsWith('.model.ts') || file.endsWith('.model.js')
  );

  for (const file of modelFiles) {
    try {
      const filePath = path.join(modelsDir, file);
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const module = require(filePath);
      const exportedModel = Object.values(module).find(
        (exp: any) => exp && typeof exp === 'object' && exp.name
      );
      if (exportedModel) {
        codeModels.set((exportedModel as any).name, exportedModel);
      }
    } catch (error) {
      console.error(`Failed to load model from ${file}:`, error);
    }
  }

  let schema: any = null;
  try {
    const projectRoot = path.resolve(modelsDir, '../..');
    const schemaPath = path.join(projectRoot, '.allium', 'schema.json');
    if (fs.existsSync(schemaPath)) {
      schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));
    }
  } catch (e) {}

  if (schema) {
    for (const schemaModel of schema.models) {
      const codeModel = codeModels.get(schemaModel.name);
      const model: ModelDefinition = {
        ...schemaModel,
        functions: codeModel?.functions || {},
      };
      models.push(model);
    }
  } else {
    for (const codeModel of codeModels.values()) {
      models.push(codeModel);
    }
  }

  return models;
}

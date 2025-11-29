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

  console.log('[autoLoadModels] Starting model loading from:', modelsDir);

  if (!fs.existsSync(modelsDir)) {
    console.warn(`Models directory not found: ${modelsDir}`);
    return models;
  }

  // Try to load schema.json for field definitions
  let schema: any = null;
  try {
    // Assume modelsDir is <projectRoot>/src/models
    const projectRoot = path.resolve(modelsDir, '../..');
    const schemaPath = path.join(projectRoot, '.allium', 'schema.json');
    console.log('[autoLoadModels] Looking for schema at:', schemaPath);

    if (fs.existsSync(schemaPath)) {
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      schema = JSON.parse(schemaContent);
      console.log(
        '[autoLoadModels] Loaded schema with',
        schema.models?.length || 0,
        'models'
      );
    } else {
      console.log('[autoLoadModels] Schema file not found');
    }
  } catch (error) {
    console.error('[autoLoadModels] Error loading schema:', error);
  }

  const files = fs.readdirSync(modelsDir);
  console.log('[autoLoadModels] Found files:', files);

  const modelFiles = files.filter(
    (file) => file.endsWith('.model.ts') || file.endsWith('.model.js')
  );
  console.log('[autoLoadModels] Filtered model files:', modelFiles);

  for (const file of modelFiles) {
    try {
      const filePath = path.join(modelsDir, file);
      console.log('[autoLoadModels] Loading module from:', filePath);
      const module = await import(filePath);
      console.log('[autoLoadModels] Module exports:', Object.keys(module));

      // Find the exported model (it should be a ModelDefinition)
      const exportedModel = Object.values(module).find(
        (exp: any) => exp && typeof exp === 'object' && exp.name
      );

      if (exportedModel) {
        console.log(
          '[autoLoadModels] Found exported model:',
          (exportedModel as any).name
        );

        // Hydrate with schema data if available
        if (schema) {
          const schemaModel = schema.models.find(
            (m: any) => m.name === (exportedModel as any).name
          );
          if (schemaModel) {
            console.log('[autoLoadModels] Hydrating model with schema data');
            console.log(
              '[autoLoadModels] Model fields before hydration:',
              JSON.stringify((exportedModel as any).fields, null, 2)
            );

            // Merge fields: combine validation rules from both model and schema
            const modelFields = (exportedModel as any).fields || [];
            const schemaFields = schemaModel.fields || [];

            console.log(
              '[autoLoadModels] Schema fields:',
              JSON.stringify(schemaFields, null, 2)
            );

            const mergedFields = schemaFields.map((schemaField: any) => {
              const modelField = modelFields.find(
                (f: any) => f.name === schemaField.name
              );

              // Merge validation: prefer schema validation if present, otherwise use model validation
              const validation =
                schemaField.validation || modelField?.validation;

              console.log(
                `[autoLoadModels] Merging field ${schemaField.name}, validation:`,
                validation
              );
              return {
                ...schemaField,
                validation,
              };
            });

            console.log(
              '[autoLoadModels] Merged fields:',
              JSON.stringify(mergedFields, null, 2)
            );

            // Merge softDelete and auditTrail: use model value if explicitly true, otherwise use schema value
            const softDelete =
              (exportedModel as any).softDelete === true
                ? true
                : schemaModel.softDelete || false;

            const auditTrail =
              (exportedModel as any).auditTrail === true
                ? true
                : schemaModel.auditTrail || false;

            Object.assign(exportedModel, schemaModel, {
              hooks: (exportedModel as any).hooks, // Preserve hooks from code
              softDelete,
              auditTrail,
              fields: mergedFields, // Use merged fields with validation
            });
            console.log(
              '[autoLoadModels] Model after hydration:',
              JSON.stringify(exportedModel, null, 2)
            );
          } else {
            console.log(
              '[autoLoadModels] No schema found for model:',
              (exportedModel as any).name
            );
          }
        }
        models.push(exportedModel as ModelDefinition);
      } else {
        console.log('[autoLoadModels] No valid model found in', file);
      }
    } catch (error) {
      console.error(`Failed to load model from ${file}:`, error);
    }
  }

  console.log('[autoLoadModels] Loaded', models.length, 'models total');
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

  // Try to load schema.json for field definitions
  let schema: any = null;
  try {
    // Assume modelsDir is <projectRoot>/src/models
    const projectRoot = path.resolve(modelsDir, '../..');
    const schemaPath = path.join(projectRoot, '.allium', 'schema.json');
    if (fs.existsSync(schemaPath)) {
      const schemaContent = fs.readFileSync(schemaPath, 'utf-8');
      schema = JSON.parse(schemaContent);
    }
  } catch (error) {
    // Schema not found or invalid, continue without it
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
        (exp: any) => exp && typeof exp === 'object' && exp.name
      );

      if (exportedModel) {
        // Hydrate with schema data if available
        if (schema) {
          const schemaModel = schema.models.find(
            (m: any) => m.name === (exportedModel as any).name
          );
          if (schemaModel) {
            Object.assign(exportedModel, schemaModel, {
              hooks: (exportedModel as any).hooks, // Preserve hooks from code
            });
          }
        }
        models.push(exportedModel as ModelDefinition);
      }
    } catch (error) {
      console.error(`Failed to load model from ${file}:`, error);
    }
  }

  return models;
}

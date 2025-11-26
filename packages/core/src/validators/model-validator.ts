import Ajv from 'ajv';
import fs from 'fs-extra';
import path from 'path';
import { ModelDefinition, AlliumSchema } from '../types/model';
import chalk from 'chalk';

const ajv = new Ajv();
const schemaPath = path.join(__dirname, '../schemas/model.schema.json');
const modelSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

export class ModelValidator {
  private validateModel = ajv.compile(modelSchema);

  /**
   * Validate a single model definition
   */
  validateModelDefinition(model: ModelDefinition): {
    valid: boolean;
    errors: string[];
  } {
    const valid = this.validateModel(model);
    const errors: string[] = [];

    if (!valid && this.validateModel.errors) {
      this.validateModel.errors.forEach((err) => {
        errors.push(`${err.instancePath} ${err.message}`);
      });
    }

    return { valid, errors };
  }

  /**
   * Validate all models in a project
   */
  async validateProject(
    projectRoot: string
  ): Promise<{ valid: boolean; errors: Record<string, string[]> }> {
    const modelsDir = path.join(projectRoot, '.allium', 'models');

    if (!fs.existsSync(modelsDir)) {
      return {
        valid: false,
        errors: { _global: ['.allium/models directory not found'] },
      };
    }

    const modelFiles = fs
      .readdirSync(modelsDir)
      .filter((f) => f.endsWith('.json'));
    const errors: Record<string, string[]> = {};
    const models: ModelDefinition[] = [];

    // Step 1: Validate individual model schemas
    for (const file of modelFiles) {
      const filePath = path.join(modelsDir, file);
      try {
        const model: ModelDefinition = JSON.parse(
          fs.readFileSync(filePath, 'utf-8')
        );
        const result = this.validateModelDefinition(model);

        if (!result.valid) {
          errors[file] = result.errors;
        } else {
          models.push(model);
        }
      } catch (e) {
        errors[file] = [`Invalid JSON: ${e}`];
      }
    }

    // Step 2: Cross-model validation (relationships)
    const modelNames = new Set(models.map((m) => m.name));

    for (const model of models) {
      const modelErrors: string[] = [];

      if (model.relations) {
        for (const rel of model.relations) {
          if (!modelNames.has(rel.model)) {
            modelErrors.push(
              `Relation '${rel.name}' references unknown model '${rel.model}'`
            );
          }
        }
      }

      if (modelErrors.length > 0) {
        const fileName = `${model.name}.json`;
        errors[fileName] = [...(errors[fileName] || []), ...modelErrors];
      }
    }

    return {
      valid: Object.keys(errors).length === 0,
      errors,
    };
  }

  /**
   * Generate aggregated schema.json from individual model files
   */
  async generateAggregatedSchema(projectRoot: string): Promise<AlliumSchema> {
    const modelsDir = path.join(projectRoot, '.allium', 'models');
    const modelFiles = fs
      .readdirSync(modelsDir)
      .filter((f) => f.endsWith('.json'));
    const models: ModelDefinition[] = [];

    for (const file of modelFiles) {
      const filePath = path.join(modelsDir, file);
      const model: ModelDefinition = JSON.parse(
        fs.readFileSync(filePath, 'utf-8')
      );
      models.push(model);
    }

    return { models };
  }

  /**
   * Print validation errors
   */
  printErrors(errors: Record<string, string[]>): void {
    console.log(chalk.red('\n✖ Validation failed:\n'));

    for (const [file, fileErrors] of Object.entries(errors)) {
      console.log(chalk.yellow(`  ${file}:`));
      fileErrors.forEach((err) => console.log(chalk.red(`    - ${err}`)));
    }
  }
}

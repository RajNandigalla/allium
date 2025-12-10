import Ajv from 'ajv';
import fs from 'fs-extra';
import path from 'path';

const ajv = new Ajv();
const schemaPath = path.join(__dirname, '../schemas/cronjob.schema.json');
const cronjobSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

export class CronJobValidator {
  private validateFn = ajv.compile(cronjobSchema);

  validate(cronjob: any): { valid: boolean; errors: string[] } {
    const valid = this.validateFn(cronjob);
    if (!valid) {
      return {
        valid: false,
        errors:
          this.validateFn.errors?.map(
            (e) => `${e.instancePath} ${e.message}`
          ) || [],
      };
    }
    return { valid: true, errors: [] };
  }

  async validateAll(
    projectRoot: string
  ): Promise<{ valid: boolean; count: number; errors: any[] }> {
    const cronjobsDir = path.join(projectRoot, '.allium', 'cronjobs');
    if (!(await fs.pathExists(cronjobsDir))) {
      return { valid: true, count: 0, errors: [] };
    }

    const files = await fs.readdir(cronjobsDir);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));
    const errors: any[] = [];

    for (const file of jsonFiles) {
      const cronjob = await fs.readJson(path.join(cronjobsDir, file));
      const result = this.validate(cronjob);
      if (!result.valid) {
        errors.push({ file, errors: result.errors });
      }
    }

    return {
      valid: errors.length === 0,
      count: jsonFiles.length,
      errors,
    };
  }
}

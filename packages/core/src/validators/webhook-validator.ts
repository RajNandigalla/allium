import Ajv from 'ajv';
import fs from 'fs-extra';
import path from 'path';

const ajv = new Ajv();
const schemaPath = path.join(__dirname, '../schemas/webhook.schema.json');
const webhookSchema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

export class WebhookValidator {
  private validateFn = ajv.compile(webhookSchema);

  validate(webhook: any): { valid: boolean; errors: string[] } {
    const valid = this.validateFn(webhook);
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
    const webhooksDir = path.join(projectRoot, '.allium', 'webhooks');
    if (!(await fs.pathExists(webhooksDir))) {
      return { valid: true, count: 0, errors: [] };
    }

    const files = await fs.readdir(webhooksDir);
    const jsonFiles = files.filter((f) => f.endsWith('.json'));
    const errors: any[] = [];

    for (const file of jsonFiles) {
      const webhook = await fs.readJson(path.join(webhooksDir, file));
      const result = this.validate(webhook);
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

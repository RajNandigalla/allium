import { getDMMF } from '@prisma/internals';
import { ModelDefinition } from './types';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Introspects Prisma schema to extract model metadata
 */
export class SchemaIntrospector {
  private schemaPath: string;
  private dmmfCache: any = null;

  constructor(schemaPath?: string) {
    if (schemaPath) {
      this.schemaPath = schemaPath;
    } else {
      // Search in standard locations
      const locations = [
        path.join(process.cwd(), 'prisma', 'schema.prisma'),
        path.join(process.cwd(), 'schema.prisma'),
      ];

      const found = locations.find((loc) => fs.existsSync(loc));

      if (found) {
        this.schemaPath = found;
      } else {
        // Default to standard location even if not found (will error later with helpful message)
        this.schemaPath = locations[0];
      }
    }
  }

  /**
   * Get DMMF (Data Model Meta Format) from Prisma schema
   */
  private async getDMMF() {
    if (this.dmmfCache) {
      return this.dmmfCache;
    }

    if (!fs.existsSync(this.schemaPath)) {
      throw new Error(
        `Prisma schema not found at ${this.schemaPath}. \n` +
          `Please run 'npx prisma init' or ensure 'prisma/schema.prisma' exists.`
      );
    }

    const schemaContent = fs.readFileSync(this.schemaPath, 'utf-8');
    this.dmmfCache = await getDMMF({ datamodel: schemaContent });

    return this.dmmfCache;
  }

  /**
   * Introspect a specific model from the Prisma schema
   */
  async introspect(modelName: string): Promise<ModelDefinition['metadata']> {
    const dmmf = await this.getDMMF();

    // Find the model in DMMF
    const model = dmmf.datamodel.models.find((m: any) => m.name === modelName);

    if (!model) {
      throw new Error(
        `Model '${modelName}' not found in Prisma schema at ${this.schemaPath}. ` +
          `Available models: ${dmmf.datamodel.models
            .map((m: any) => m.name)
            .join(', ')}`
      );
    }

    // Extract field information
    const fields = model.fields
      .filter((f: any) => f.kind === 'scalar' || f.kind === 'enum')
      .map((f: any) => ({
        name: f.name,
        type: f.type,
        required: f.isRequired,
        unique: f.isUnique,
        list: f.isList,
        kind: f.kind,
      }));

    // Extract relation information
    const relations = model.fields
      .filter((f: any) => f.kind === 'object')
      .map((f: any) => ({
        name: f.name,
        model: f.type,
        type: f.relationName || 'unknown',
        isList: f.isList,
      }));

    return {
      fields,
      relations,
    };
  }

  /**
   * Introspect all models from the Prisma schema
   */
  async introspectAll(): Promise<
    Array<{ name: string; metadata: ModelDefinition['metadata'] }>
  > {
    const dmmf = await this.getDMMF();

    return Promise.all(
      dmmf.datamodel.models.map(async (model: any) => ({
        name: model.name,
        metadata: await this.introspect(model.name),
      }))
    );
  }

  /**
   * Clear the DMMF cache (useful for testing or schema changes)
   */
  clearCache(): void {
    this.dmmfCache = null;
  }
}

import { AlliumSchema, ModelDefinition, Relation } from '../types/model';

export function generatePrismaSchema(
  schema: AlliumSchema,
  provider?: string
): string {
  const { models } = schema;

  // Use provided provider or default to postgresql
  const dbProvider = provider || 'postgresql';

  let output = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${dbProvider}"
}

`;

  // Generate enums first
  const enums = new Set<string>();
  for (const model of models) {
    for (const field of model.fields) {
      if (field.type === 'Enum' && field.values) {
        const enumName = `${model.name}${capitalize(field.name)}`;
        if (!enums.has(enumName)) {
          output += `enum ${enumName} {\n`;
          for (const value of field.values) {
            output += `  ${value.toUpperCase()}\n`;
          }
          output += `}\n\n`;
          enums.add(enumName);
        }
      }
    }
  }

  for (const model of models) {
    output += generatePrismaModel(model, models);
    output += '\n';
  }

  return output;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function generatePrismaModel(
  model: ModelDefinition,
  allModels: ModelDefinition[]
): string {
  // Validate that model has fields defined
  if (!model.fields || !Array.isArray(model.fields)) {
    throw new Error(
      `Model "${model.name}" is missing field definitions. ` +
        `This usually means the schema hasn't been synced yet. ` +
        `Please run 'allium sync' to generate the schema from your model definitions.`
    );
  }

  let output = `model ${model.name} {\n`;

  // Add ID field (uuid)
  output += `  id        String   @id @default(uuid())\n`;
  output += `  uuid      String   @unique @default(uuid())\n`;

  // Add regular fields
  for (const field of model.fields) {
    const optional = field.required === false ? '?' : '';
    const unique = field.unique ? ' @unique' : '';

    // Handle Enum type
    let fieldType = field.type;
    if (field.type === 'Enum') {
      fieldType = `${model.name}${capitalize(field.name)}` as any;
    }

    const defaultValue =
      field.default !== undefined
        ? ` @default(${formatDefault(field.default, field.type)})`
        : '';

    output += `  ${field.name} ${fieldType}${optional}${unique}${defaultValue}\n`;
  }

  // Add relations
  if (model.relations) {
    for (const rel of model.relations) {
      output += generatePrismaRelation(rel, model.name);
    }
  }

  // Add timestamps
  output += `  createdAt DateTime @default(now())\n`;
  output += `  updatedAt DateTime @updatedAt\n`;

  // Add soft delete field
  if (model.softDelete) {
    output += `  deletedAt DateTime?\n`;
  }

  // Add audit trail fields
  if (model.auditTrail) {
    output += `  createdBy String?\n`;
    output += `  updatedBy String?\n`;
    output += `  deletedBy String?\n`;
  }

  output += `}\n`;
  return output;
}

function generatePrismaRelation(
  rel: Relation,
  currentModelName: string
): string {
  const foreignKey = rel.foreignKey || `${rel.name}Id`;
  const references = rel.references || 'id';

  if (rel.type === '1:1') {
    return (
      `  ${rel.name} ${rel.model}? @relation(fields: [${foreignKey}], references: [${references}])\n` +
      `  ${foreignKey} String? @unique\n`
    );
  } else if (rel.type === '1:n') {
    // This model is the child (has foreign key)
    return (
      `  ${rel.name} ${rel.model} @relation(fields: [${foreignKey}], references: [${references}])\n` +
      `  ${foreignKey} String\n`
    );
  } else {
    // n:m
    return `  ${rel.name} ${rel.model}[]\n`;
  }
}

function formatDefault(value: string | number | boolean, type: string): string {
  if (type === 'Enum') return String(value).toUpperCase();
  if (type === 'String') return `"${value}"`;
  if (type === 'Boolean') return String(value);
  if (type === 'DateTime' && value === 'now') return 'now()';
  return String(value);
}

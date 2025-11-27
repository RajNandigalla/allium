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

  for (const model of models) {
    output += generatePrismaModel(model, models);
    output += '\n';
  }

  return output;
}

function generatePrismaModel(
  model: ModelDefinition,
  allModels: ModelDefinition[]
): string {
  let output = `model ${model.name} {\n`;

  // Add ID field (uuid)
  output += `  id        String   @id @default(uuid())\n`;
  output += `  uuid      String   @unique @default(uuid())\n`;

  // Add regular fields
  for (const field of model.fields) {
    const optional = field.required === false ? '?' : '';
    const unique = field.unique ? ' @unique' : '';
    const defaultValue =
      field.default !== undefined
        ? ` @default(${formatDefault(field.default, field.type)})`
        : '';

    output += `  ${field.name} ${field.type}${optional}${unique}${defaultValue}\n`;
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
  if (type === 'String') return `"${value}"`;
  if (type === 'Boolean') return String(value);
  if (type === 'DateTime' && value === 'now') return 'now()';
  return String(value);
}

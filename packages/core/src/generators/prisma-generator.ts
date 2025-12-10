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

  // Build a map of opposite relations for each model
  const oppositeRelations = new Map<
    string,
    Array<{ name: string; model: string; relationType: string }>
  >();

  for (const model of models) {
    if (model.relations) {
      for (const rel of model.relations) {
        if (rel.type === '1:n' && rel.model) {
          // For 1:n relations, add the opposite relation to the parent model
          // User has 1:n to Facility -> Facility should have users User[]
          if (!oppositeRelations.has(rel.model)) {
            oppositeRelations.set(rel.model, []);
          }

          // Use plural form of the child model name for the opposite relation
          const oppositeName = pluralize(model.name.toLowerCase());
          oppositeRelations.get(rel.model)!.push({
            name: oppositeName,
            model: model.name,
            relationType: 'array',
          });
        } else if (rel.type === '1:1' && rel.model) {
          // For 1:1 relations, add the opposite relation to the related model
          if (!oppositeRelations.has(rel.model)) {
            oppositeRelations.set(rel.model, []);
          }

          const oppositeName = model.name.toLowerCase();
          oppositeRelations.get(rel.model)!.push({
            name: oppositeName,
            model: model.name,
            relationType: 'optional',
          });
        }
        // n:m relations are already bidirectional by nature in Prisma
      }
    }
  }

  for (const model of models) {
    output += generatePrismaModel(
      model,
      models,
      oppositeRelations.get(model.name) || []
    );
    output += '\n';
  }

  // Check if ApiKey model is present, if not append it
  const hasApiKey = models.some((m) => m.name === 'ApiKey');
  if (!hasApiKey) {
    output += `model ApiKey {
  id        String   @id @default(uuid())
  uuid      String   @unique @default(uuid())
  name      String
  key       String   @unique
  service   String
  isActive  Boolean  @default(true)
  expiresAt DateTime?
  lastUsedAt DateTime?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?
  updatedBy String?
  deletedBy String?
}
`;
  }

  // Check if ApiMetric model is present, if not append it
  const hasApiMetric = models.some((m) => m.name === 'ApiMetric');
  if (!hasApiMetric) {
    output += `model ApiMetric {
  id          String   @id @default(uuid())
  uuid        String   @unique @default(uuid())
  endpoint    String
  method      String
  statusCode  Int
  latency     Int
  timestamp   DateTime @default(now())
  errorType   String?
  errorMessage String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([endpoint, timestamp])
  @@index([timestamp])
}
`;
  }

  // Note: Webhook is now file-based (no database model)

  // Note: CronJob is now file-based (no database model)

  return output;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function pluralize(str: string): string {
  // Simple pluralization - can be enhanced with a library if needed
  if (str.endsWith('y')) {
    return str.slice(0, -1) + 'ies';
  } else if (
    str.endsWith('s') ||
    str.endsWith('x') ||
    str.endsWith('ch') ||
    str.endsWith('sh')
  ) {
    return str + 'es';
  } else {
    return str + 's';
  }
}

function generatePrismaModel(
  model: ModelDefinition,
  allModels: ModelDefinition[],
  oppositeRelations: Array<{
    name: string;
    model: string;
    relationType: string;
  }> = []
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

  // Add relations defined in this model
  if (model.relations) {
    for (const rel of model.relations) {
      output += generatePrismaRelation(rel, model.name);
    }
  }

  // Add opposite relations (automatically inferred from other models)
  for (const oppRel of oppositeRelations) {
    if (oppRel.relationType === 'array') {
      output += `  ${oppRel.name} ${oppRel.model}[]\n`;
    } else if (oppRel.relationType === 'optional') {
      output += `  ${oppRel.name} ${oppRel.model}?\n`;
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

  // Add Draft/Publish fields
  if (model.draftPublish) {
    output += `  status String @default("DRAFT")\n`; // DRAFT, PUBLISHED, ARCHIVED
    output += `  publishedAt DateTime?\n`;
  }

  // Add compound unique constraints
  if (model.constraints?.unique) {
    for (const fields of model.constraints.unique) {
      output += `\n  @@unique([${fields.join(', ')}])\n`;
    }
  }

  // Add compound indexes
  if (model.constraints?.indexes) {
    for (const fields of model.constraints.indexes) {
      output += `\n  @@index([${fields.join(', ')}])\n`;
    }
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
  const onDelete = rel.onDelete ? `, onDelete: ${rel.onDelete}` : '';

  if (rel.type === '1:1') {
    return (
      `  ${rel.name} ${rel.model}? @relation(fields: [${foreignKey}], references: [${references}]${onDelete})\n` +
      `  ${foreignKey} String? @unique\n`
    );
  } else if (rel.type === '1:n') {
    // This model is the child (has foreign key)
    // Check if relation is optional (defaults to required if not specified)
    const isOptional = rel.required === false;
    const optionalMarker = isOptional ? '?' : '';

    return (
      `  ${rel.name} ${rel.model}${optionalMarker} @relation(fields: [${foreignKey}], references: [${references}]${onDelete})\n` +
      `  ${foreignKey} String${optionalMarker}\n`
    );
  } else if (rel.type === 'polymorphic') {
    // Polymorphic relation: Generate multiple nullable foreign keys
    if (!rel.models || rel.models.length === 0) {
      throw new Error(
        `Polymorphic relation "${rel.name}" in model "${currentModelName}" must specify 'models' array.`
      );
    }

    let output = '';
    for (const targetModel of rel.models) {
      // e.g. post Post? @relation(fields: [postId], references: [id])
      //      postId String?
      const fieldName =
        targetModel.charAt(0).toLowerCase() + targetModel.slice(1);
      const fkName = `${fieldName}Id`;

      output += `  ${fieldName} ${targetModel}? @relation(fields: [${fkName}], references: [id]${onDelete})\n`;
      output += `  ${fkName} String?\n`;
    }
    return output;
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

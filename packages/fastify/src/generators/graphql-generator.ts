import { ModelDefinition } from '@allium/core';

/**
 * Map Prisma field types to GraphQL types
 */
function mapPrismaTypeToGraphQL(prismaType: string): string {
  const typeMap: Record<string, string> = {
    String: 'String',
    Int: 'Int',
    Float: 'Float',
    Boolean: 'Boolean',
    DateTime: 'String', // TODO: Add DateTime scalar
    Json: 'JSON', // TODO: Add JSON scalar
  };

  return typeMap[prismaType] || 'String';
}

/**
 * Generate GraphQL Type Definitions (SDL)
 */
export function generateGraphQLTypeDefs(models: ModelDefinition[]): string {
  let typeDefs = `
    scalar JSON
    scalar DateTime

    type Query {
      _empty: String
    }

    type Mutation {
      _empty: String
    }
  `;

  for (const model of models) {
    typeDefs += generateModelTypes(model);
    typeDefs += generateQueryTypes(model);
    typeDefs += generateMutationTypes(model);
  }

  return typeDefs;
}

function generateModelTypes(model: ModelDefinition): string {
  const fields = (model as any).fields || model.metadata?.fields || [];

  let output = `
    type ${model.name} {
      id: ID!
      uuid: String!
      createdAt: String!
      updatedAt: String!
  `;

  // Fields
  for (const field of fields) {
    if (field.private) continue;

    const gqlType = mapPrismaTypeToGraphQL(field.type);
    const required = field.required !== false ? '!' : '';

    output += `    ${field.name}: ${gqlType}${required}\n`;
  }

  // Relations (TODO: Add relations)
  if (model.relations) {
    for (const rel of model.relations) {
      if (rel.type === '1:1' || rel.type === '1:n') {
        output += `    ${rel.name}: ${rel.model}\n`;
      } else if (rel.type === 'n:m') {
        output += `    ${rel.name}: [${rel.model}!]!\n`;
      } else if (rel.type === 'polymorphic') {
        if (rel.models) {
          for (const target of rel.models) {
            const fieldName = target.charAt(0).toLowerCase() + target.slice(1);
            output += `    ${fieldName}: ${target}\n`;
          }
        }
      }
    }
  }

  output += `  }\n`;

  // Input Types
  output += `
    input ${model.name}CreateInput {
  `;

  for (const field of fields) {
    if (
      field.name === 'id' ||
      field.name === 'uuid' ||
      field.name === 'createdAt' ||
      field.name === 'updatedAt'
    )
      continue;

    const gqlType = mapPrismaTypeToGraphQL(field.type);
    const required =
      field.required !== false && field.default === undefined ? '!' : '';
    output += `    ${field.name}: ${gqlType}${required}\n`;
  }

  // Add relation inputs (IDs)
  if (model.relations) {
    for (const rel of model.relations) {
      if (rel.type === '1:1' || rel.type === '1:n') {
        // Add foreign key input
        const fkName = rel.foreignKey || `${rel.name}Id`;
        output += `    ${fkName}: String\n`;
      } else if (rel.type === 'polymorphic' && rel.models) {
        for (const target of rel.models) {
          const fieldName = target.charAt(0).toLowerCase() + target.slice(1);
          const fkName = `${fieldName}Id`;
          output += `    ${fkName}: String\n`;
        }
      }
    }
  }

  output += `  }\n`;

  output += `
    input ${model.name}UpdateInput {
  `;
  for (const field of fields) {
    if (
      field.name === 'id' ||
      field.name === 'uuid' ||
      field.name === 'createdAt' ||
      field.name === 'updatedAt'
    )
      continue;
    const gqlType = mapPrismaTypeToGraphQL(field.type);
    output += `    ${field.name}: ${gqlType}\n`;
  }
  output += `  }\n`;

  return output;
}

function generateQueryTypes(model: ModelDefinition): string {
  const modelName = model.name;
  const camelName = modelName.charAt(0).toLowerCase() + modelName.slice(1);
  const pluralName = camelName + 's'; // Simple pluralization

  return `
    extend type Query {
      ${camelName}(id: ID!): ${modelName}
      ${pluralName}(limit: Int, offset: Int): [${modelName}!]!
    }
  `;
}

function generateMutationTypes(model: ModelDefinition): string {
  const modelName = model.name;

  return `
    extend type Mutation {
      create${modelName}(data: ${modelName}CreateInput!): ${modelName}!
      update${modelName}(id: ID!, data: ${modelName}UpdateInput!): ${modelName}!
      delete${modelName}(id: ID!): ${modelName}
    }
  `;
}

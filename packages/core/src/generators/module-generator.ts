import fs from 'fs-extra';
import path from 'path';
import { ModelDefinition, Field } from '../types/model';
import {
  detectOverrides,
  getGeneratedPath,
  getModuleIndexPath,
} from '../utils/override-detector';
import { generateModuleIndex } from './index-generator';
import {
  generateBaseController,
  generateBaseRoutes,
  generateBaseResolver,
} from './base-generator';

export async function generateModuleFiles(
  projectRoot: string,
  model: ModelDefinition
) {
  const modelLower = model.name.toLowerCase();

  // Detect existing overrides
  const overrides = detectOverrides(projectRoot, model.name);
  model.hasOverrides = overrides;

  // Generate to hidden directory
  const generatedPath = getGeneratedPath(projectRoot, model.name);
  fs.mkdirSync(generatedPath, { recursive: true });

  // Generate all files to .allium/generated
  const serviceContent = generateService(model);
  fs.writeFileSync(
    path.join(generatedPath, `${modelLower}.service.ts`),
    serviceContent
  );

  const controllerContent = generateController(model);
  fs.writeFileSync(
    path.join(generatedPath, `${modelLower}.controller.ts`),
    controllerContent
  );

  const schemaContent = generateSchema(model);
  fs.writeFileSync(
    path.join(generatedPath, `${modelLower}.schema.ts`),
    schemaContent
  );

  const routesContent = generateRoutes(model);
  fs.writeFileSync(
    path.join(generatedPath, `${modelLower}.routes.ts`),
    routesContent
  );

  const resolverContent = generateResolver(model);
  fs.writeFileSync(
    path.join(generatedPath, `${modelLower}.resolver.ts`),
    resolverContent
  );

  // Create public module directory
  const publicModulePath = path.join(projectRoot, 'src', 'modules', modelLower);
  fs.mkdirSync(publicModulePath, { recursive: true });

  // Generate index.ts that exports the right implementation
  const indexContent = generateModuleIndex(model, overrides);
  const indexPath = getModuleIndexPath(projectRoot, model.name);
  fs.writeFileSync(indexPath, indexContent);

  // Generate registerModel TypeScript file in src/models/
  const modelsDir = path.join(projectRoot, 'src', 'models');
  fs.mkdirSync(modelsDir, { recursive: true });

  const modelFileName = `${modelLower}.model.ts`;
  const modelFilePath = path.join(modelsDir, modelFileName);

  // Only create if it doesn't exist (don't overwrite user customizations)
  if (!fs.existsSync(modelFilePath)) {
    const modelContent = `import { registerModel } from '@allium/core';

export const ${model.name} = registerModel('${model.name}', {
  functions: {
    // Add hooks here
    // beforeCreate: async (data, context) => {
    //   return data;
    // },
  },
});
`;
    fs.writeFileSync(modelFilePath, modelContent);
  }

  // Create .gitignore in .allium if it doesn't exist
  const alliumPath = path.join(projectRoot, '.allium');
  const gitignorePath = path.join(alliumPath, '.gitignore');
  if (!fs.existsSync(gitignorePath)) {
    fs.writeFileSync(gitignorePath, 'generated/\n');
  }

  // Generate base controller (shared across all models)
  const basePath = path.join(projectRoot, '.allium', 'generated', 'base');
  fs.mkdirSync(basePath, { recursive: true });

  const baseControllerPath = path.join(basePath, 'base.controller.ts');
  if (!fs.existsSync(baseControllerPath)) {
    fs.writeFileSync(baseControllerPath, generateBaseController());
  }

  const baseRoutesPath = path.join(basePath, 'base.routes.ts');
  if (!fs.existsSync(baseRoutesPath)) {
    fs.writeFileSync(baseRoutesPath, generateBaseRoutes());
  }

  const baseResolverPath = path.join(basePath, 'base.resolver.ts');
  if (!fs.existsSync(baseResolverPath)) {
    fs.writeFileSync(baseResolverPath, generateBaseResolver());
  }
}

function generateService(model: ModelDefinition): string {
  const modelName = model.name;
  const modelLower = modelName.toLowerCase();

  return `import { prisma } from '../../plugins/prisma';
import { Create${modelName}Input, Update${modelName}Input } from './${modelLower}.schema';

export class ${modelName}Service {
  async create(data: Create${modelName}Input) {
    return prisma.${modelLower}.create({ data });
  }

  async findAll() {
    return prisma.${modelLower}.findMany();
  }

  async findById(id: string) {
    return prisma.${modelLower}.findUnique({ where: { id } });
  }

  async update(id: string, data: Update${modelName}Input) {
    return prisma.${modelLower}.update({ where: { id }, data });
  }

  async delete(id: string) {
    return prisma.${modelLower}.delete({ where: { id } });
  }
}

export const ${modelLower}Service = new ${modelName}Service();
`;
}

function generateController(model: ModelDefinition): string {
  const modelName = model.name;
  const modelLower = modelName.toLowerCase();

  return `import { createCrudController } from '../../../base/base.controller';
import { ${modelLower}Service } from './${modelLower}.service';

// Create controller using generic factory
const controller = createCrudController(${modelLower}Service, '${modelName}');

// Export individual handlers
export const create${modelName}Handler = controller.create;
export const get${modelName}sHandler = controller.findAll;
export const get${modelName}Handler = controller.findById;
export const update${modelName}Handler = controller.update;
export const delete${modelName}Handler = controller.delete;
`;
}

function generateSchema(model: ModelDefinition): string {
  const modelName = model.name;

  const fieldSchemas = model.fields
    .map((f) => {
      const zodType = getZodType(f);
      const optional = f.required === false ? '.optional()' : '';
      return `  ${f.name}: z.${zodType}${optional},`;
    })
    .join('\n');

  return `import { z } from 'zod';

export const create${modelName}Schema = z.object({
${fieldSchemas}
});

export const update${modelName}Schema = create${modelName}Schema.partial();

export const read${modelName}Schema = create${modelName}Schema.extend({
  id: z.string().uuid(),
  uuid: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Create${modelName}Input = z.infer<typeof create${modelName}Schema>;
export type Update${modelName}Input = z.infer<typeof update${modelName}Schema>;
export type Read${modelName}Output = z.infer<typeof read${modelName}Schema>;
`;
}

function generateRoutes(model: ModelDefinition): string {
  const modelName = model.name;
  const modelLower = modelName.toLowerCase();
  const operations = model.api?.operations || [
    'create',
    'read',
    'update',
    'delete',
  ];

  return `import { FastifyInstance } from 'fastify';
import { createCrudRoutes } from '../../../base/base.routes';
import {
  create${modelName}Handler,
  get${modelName}sHandler,
  get${modelName}Handler,
  update${modelName}Handler,
  delete${modelName}Handler,
} from './${modelLower}.controller';
import { create${modelName}Schema, update${modelName}Schema, read${modelName}Schema } from './${modelLower}.schema';

export const ${modelLower}Routes = createCrudRoutes(
  {
    create: create${modelName}Handler,
    findAll: get${modelName}sHandler,
    findById: get${modelName}Handler,
    update: update${modelName}Handler,
    delete: delete${modelName}Handler,
  },
  {
    create: create${modelName}Schema,
    update: update${modelName}Schema,
    read: read${modelName}Schema,
  },
  '${modelName}',
  ${JSON.stringify(operations)}
);
`;
}

function generateResolver(model: ModelDefinition): string {
  const modelName = model.name;
  const modelLower = modelName.toLowerCase();

  return `import { createCrudResolver } from '../../../base/base.resolver';
import { ${modelLower}Service } from './${modelLower}.service';

export const ${modelLower}Resolvers = createCrudResolver(${modelLower}Service, '${modelName}');
`;
}

function getZodType(field: Field): string {
  switch (field.type) {
    case 'String':
      return 'string()';
    case 'Int':
      return 'number().int()';
    case 'Float':
      return 'number()';
    case 'Boolean':
      return 'boolean()';
    case 'DateTime':
      return 'string().datetime()';
    case 'Json':
      return 'any()';
    default:
      return 'string()';
  }
}

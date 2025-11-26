import fs from 'fs-extra';
import path from 'path';
import { ModelDefinition, Field } from '../types/model';

export async function generateModuleFiles(
  projectRoot: string,
  model: ModelDefinition
) {
  const modulePath = path.join(
    projectRoot,
    'src',
    'modules',
    model.name.toLowerCase()
  );
  fs.mkdirSync(modulePath, { recursive: true });

  // Generate Service
  const serviceContent = generateService(model);
  fs.writeFileSync(
    path.join(modulePath, `${model.name.toLowerCase()}.service.ts`),
    serviceContent
  );

  // Generate Controller
  const controllerContent = generateController(model);
  fs.writeFileSync(
    path.join(modulePath, `${model.name.toLowerCase()}.controller.ts`),
    controllerContent
  );

  // Generate Schema
  const schemaContent = generateSchema(model);
  fs.writeFileSync(
    path.join(modulePath, `${model.name.toLowerCase()}.schema.ts`),
    schemaContent
  );

  // Generate Routes
  const routesContent = generateRoutes(model);
  fs.writeFileSync(
    path.join(modulePath, `${model.name.toLowerCase()}.routes.ts`),
    routesContent
  );

  // Generate GraphQL Resolvers
  const resolverContent = generateResolver(model);
  fs.writeFileSync(
    path.join(modulePath, `${model.name.toLowerCase()}.resolver.ts`),
    resolverContent
  );
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

  async findById(id: number) {
    return prisma.${modelLower}.findUnique({ where: { id } });
  }

  async update(id: number, data: Update${modelName}Input) {
    return prisma.${modelLower}.update({ where: { id }, data });
  }

  async delete(id: number) {
    return prisma.${modelLower}.delete({ where: { id } });
  }
}

export const ${modelLower}Service = new ${modelName}Service();
`;
}

function generateController(model: ModelDefinition): string {
  const modelName = model.name;
  const modelLower = modelName.toLowerCase();

  return `import { FastifyReply, FastifyRequest } from 'fastify';
import { ${modelLower}Service } from './${modelLower}.service';
import { Create${modelName}Input, Update${modelName}Input } from './${modelLower}.schema';

export async function create${modelName}Handler(
  request: FastifyRequest<{ Body: Create${modelName}Input }>,
  reply: FastifyReply
) {
  const ${modelLower} = await ${modelLower}Service.create(request.body);
  return ${modelLower};
}

export async function get${modelName}sHandler() {
  return ${modelLower}Service.findAll();
}

export async function get${modelName}Handler(
  request: FastifyRequest<{ Params: { id: string } }>
) {
  const id = parseInt(request.params.id);
  return ${modelLower}Service.findById(id);
}

export async function update${modelName}Handler(
  request: FastifyRequest<{ Params: { id: string }; Body: Update${modelName}Input }>
) {
  const id = parseInt(request.params.id);
  return ${modelLower}Service.update(id, request.body);
}

export async function delete${modelName}Handler(
  request: FastifyRequest<{ Params: { id: string } }>
) {
  const id = parseInt(request.params.id);
  return ${modelLower}Service.delete(id);
}
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

export type Create${modelName}Input = z.infer<typeof create${modelName}Schema>;
export type Update${modelName}Input = z.infer<typeof update${modelName}Schema>;
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
  const prefix = model.api?.prefix || `/api/${modelLower}s`;

  let routes = `import { FastifyInstance } from 'fastify';
import {
  create${modelName}Handler,
  get${modelName}sHandler,
  get${modelName}Handler,
  update${modelName}Handler,
  delete${modelName}Handler,
} from './${modelLower}.controller';
import { create${modelName}Schema, update${modelName}Schema } from './${modelLower}.schema';

export async function ${modelLower}Routes(app: FastifyInstance) {
`;

  if (operations.includes('create')) {
    routes += `  app.post('/', {
    schema: { body: create${modelName}Schema }
  }, create${modelName}Handler);

`;
  }

  if (operations.includes('read')) {
    routes += `  app.get('/', get${modelName}sHandler);

  app.get('/:id', get${modelName}Handler);

`;
  }

  if (operations.includes('update')) {
    routes += `  app.put('/:id', {
    schema: { body: update${modelName}Schema }
  }, update${modelName}Handler);

`;
  }

  if (operations.includes('delete')) {
    routes += `  app.delete('/:id', delete${modelName}Handler);

`;
  }

  routes += `}\n`;
  return routes;
}

function generateResolver(model: ModelDefinition): string {
  const modelName = model.name;
  const modelLower = modelName.toLowerCase();

  return `import { ${modelLower}Service } from './${modelLower}.service';

export const ${modelLower}Resolvers = {
  Query: {
    ${modelLower}s: async () => {
      return ${modelLower}Service.findAll();
    },
    ${modelLower}: async (_: any, { id }: { id: number }) => {
      return ${modelLower}Service.findById(id);
    },
  },
  Mutation: {
    create${modelName}: async (_: any, { input }: { input: any }) => {
      return ${modelLower}Service.create(input);
    },
    update${modelName}: async (_: any, { id, input }: { id: number; input: any }) => {
      return ${modelLower}Service.update(id, input);
    },
    delete${modelName}: async (_: any, { id }: { id: number }) => {
      return ${modelLower}Service.delete(id);
    },
  },
};
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

import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';

interface Field {
  name: string;
  type: string;
  required: boolean;
}

interface Relation {
  relatedModel: string;
  type: '1:1' | '1:n' | 'n:m';
  fieldName: string;
}

export const generateResource = async (
  modelName: string,
  fields: Field[],
  relations: Relation[]
) => {
  const spinner = ora(`Generating resource ${modelName}...`).start();

  try {
    const projectRoot = process.cwd();
    const prismaPath = path.join(projectRoot, 'prisma', 'schema.prisma');

    if (!fs.existsSync(prismaPath)) {
      throw new Error(
        'prisma/schema.prisma not found. Are you in an Allium project?'
      );
    }

    // 1. Update Prisma Schema
    let schemaContent = fs.readFileSync(prismaPath, 'utf-8');

    // Check if model already exists
    if (schemaContent.includes(`model ${modelName}`)) {
      throw new Error(`Model ${modelName} already exists in schema.`);
    }

    let modelDefinition = `\nmodel ${modelName} {\n`;
    modelDefinition += `  id    Int     @id @default(autoincrement())\n`;

    fields.forEach((field) => {
      modelDefinition += `  ${field.name} ${field.type}${
        field.required ? '' : '?'
      }\n`;
    });

    relations.forEach((rel) => {
      if (rel.type === '1:n') {
        // Assuming this side holds the foreign key for 1:n (child)
        // Or is this the parent? Usually 1:n means User has many Posts.
        // If we are generating Post, and it relates to User (1:n), Post has userId.
        // The prompt asked "Related Model".
        // If I am generating "Post" and related is "User" (1:n), it implies User has many Posts.
        // So Post should have `user User @relation(...)`

        // Simplified assumption: We are generating the side that holds the relation if it's 1:1 or child of 1:n
        // But for n:m it's implicit.

        // Let's handle simple case: We add the field here.
        // We might need to update the OTHER model too, which is complex.
        // For now, let's just add the field on THIS model and warn user to update the other side.

        modelDefinition += `  ${rel.fieldName} ${rel.relatedModel} @relation(fields: [${rel.fieldName}Id], references: [id])\n`;
        modelDefinition += `  ${rel.fieldName}Id Int\n`;
      } else if (rel.type === '1:1') {
        modelDefinition += `  ${rel.fieldName} ${rel.relatedModel} @relation(fields: [${rel.fieldName}Id], references: [id])\n`;
        modelDefinition += `  ${rel.fieldName}Id Int @unique\n`;
      } else {
        // n:m
        modelDefinition += `  ${rel.fieldName} ${rel.relatedModel}[]\n`;
      }
    });

    modelDefinition += `  createdAt DateTime @default(now())\n`;
    modelDefinition += `  updatedAt DateTime @updatedAt\n`;
    modelDefinition += `}\n`;

    fs.appendFileSync(prismaPath, modelDefinition);

    // 2. Generate Module Files
    const modulePath = path.join(
      projectRoot,
      'src',
      'modules',
      modelName.toLowerCase()
    );
    fs.mkdirSync(modulePath, { recursive: true });

    // Controller
    const controllerContent = `import { FastifyReply, FastifyRequest } from 'fastify';
import { prisma } from '../../plugins/prisma';
import { Create${modelName}Input } from './${modelName.toLowerCase()}.schema';

export async function create${modelName}Handler(
  request: FastifyRequest<{ Body: Create${modelName}Input }>,
  reply: FastifyReply
) {
  const body = request.body;
  const ${modelName.toLowerCase()} = await prisma.${modelName.toLowerCase()}.create({
    data: body,
  });
  return ${modelName.toLowerCase()};
}

export async function get${modelName}sHandler() {
  const ${modelName.toLowerCase()}s = await prisma.${modelName.toLowerCase()}.findMany();
  return ${modelName.toLowerCase()}s;
}
`;
    fs.writeFileSync(
      path.join(modulePath, `${modelName.toLowerCase()}.controller.ts`),
      controllerContent
    );

    // Schema (Zod)
    const schemaFileContent = `import { z } from 'zod';

export const create${modelName}Schema = z.object({
${fields
  .map((f) => {
    let zodType = 'string()';
    if (f.type === 'Int') zodType = 'number().int()';
    else if (f.type === 'Float') zodType = 'number()';
    else if (f.type === 'Boolean') zodType = 'boolean()';
    else if (f.type === 'DateTime')
      zodType = 'string().datetime()'; // or date() depending on input
    else if (f.type === 'Json') zodType = 'any()';

    return `  ${f.name}: z.${zodType}${f.required ? '' : '.optional()'},`;
  })
  .join('\n')}
});

export type Create${modelName}Input = z.infer<typeof create${modelName}Schema>;
`;
    fs.writeFileSync(
      path.join(modulePath, `${modelName.toLowerCase()}.schema.ts`),
      schemaFileContent
    );

    // Routes
    const routesContent = `import { FastifyInstance } from 'fastify';
import { create${modelName}Handler, get${modelName}sHandler } from './${modelName.toLowerCase()}.controller';
import { create${modelName}Schema } from './${modelName.toLowerCase()}.schema';

export async function ${modelName.toLowerCase()}Routes(app: FastifyInstance) {
  app.post('/', {
    schema: {
      body: create${modelName}Schema,
    }
  }, create${modelName}Handler);

  app.get('/', get${modelName}sHandler);
}
`;
    fs.writeFileSync(
      path.join(modulePath, `${modelName.toLowerCase()}.routes.ts`),
      routesContent
    );

    // 3. Register in App (Simplified: User needs to do this manually or we use a pattern)
    // For now, let's just warn the user to register it.

    spinner.succeed(
      chalk.green(`Resource ${modelName} generated successfully!`)
    );
    console.log(chalk.yellow(`\nAction Required:`));
    console.log(`1. Run 'npx prisma generate' to update the client.`);
    console.log(`2. Register the routes in 'src/app.ts':`);
    console.log(
      chalk.cyan(
        `   import { ${modelName.toLowerCase()}Routes } from './modules/${modelName.toLowerCase()}/${modelName.toLowerCase()}.routes';`
      )
    );
    console.log(
      chalk.cyan(
        `   app.register(${modelName.toLowerCase()}Routes, { prefix: 'api/${modelName.toLowerCase()}s' });`
      )
    );
    if (relations.length > 0) {
      console.log(
        `3. Update related models in 'prisma/schema.prisma' to complete the relationship.`
      );
    }
  } catch (error) {
    spinner.fail(chalk.red('Failed to generate resource.'));
    console.error(error);
  }
};

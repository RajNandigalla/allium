import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';

export const override = async (options: { model?: string; layer?: string }) => {
  const questions = [];

  if (!options.model) {
    questions.push({
      type: 'input',
      name: 'model',
      message: 'Which model do you want to override?',
    });
  }

  if (!options.layer) {
    questions.push({
      type: 'list',
      name: 'layer',
      message: 'Which layer do you want to override?',
      choices: ['service', 'controller', 'routes'],
    });
  }

  const answers = await inquirer.prompt(questions);
  const modelName = options.model || answers.model;
  const layer = options.layer || answers.layer;

  const modelLower = modelName.toLowerCase();
  const overridePath = path.join(
    process.cwd(),
    'src',
    'modules',
    modelLower,
    'overrides'
  );

  // Create overrides directory if it doesn't exist
  fs.mkdirSync(overridePath, { recursive: true });

  const fileName = `${modelLower}.${layer}.ts`;
  const filePath = path.join(overridePath, fileName);

  // Check if override already exists
  if (fs.existsSync(filePath)) {
    console.log(chalk.yellow(`Override already exists: ${filePath}`));
    return;
  }

  // Generate override template
  let template = '';
  const generatedPath = `../../../../.allium/generated/modules/${modelLower}/${modelLower}.${layer}`;

  if (layer === 'service') {
    template = generateServiceOverride(modelName, generatedPath);
  } else if (layer === 'controller') {
    template = generateControllerOverride(modelName, generatedPath);
  } else if (layer === 'routes') {
    template = generateRoutesOverride(modelName, generatedPath);
  }

  fs.writeFileSync(filePath, template);

  console.log(chalk.green(`✓ Created override: ${filePath}`));
  console.log(chalk.blue('\nNext steps:'));
  console.log(`  1. Edit ${filePath}`);
  console.log(`  2. Run 'allium sync' to regenerate index exports`);
};

function generateServiceOverride(
  modelName: string,
  generatedPath: string
): string {
  const className = `${modelName}Service`;
  const generatedClassName = `Generated${className}`;

  return `import { ${className} as ${generatedClassName} } from '${generatedPath}';

/**
 * ${modelName} Service Override
 * 
 * This class extends the generated service.
 * Add your custom methods or override existing ones here.
 */
export class ${className} extends ${generatedClassName} {
  // Example: Override an existing method
  // async findAll() {
  //   // Custom logic
  //   return super.findAll();
  // }

  // Example: Add a custom method
  // async findByCustomField(value: string) {
  //   return this.prisma.${modelName.toLowerCase()}.findMany({
  //     where: { customField: value }
  //   });
  // }
}

export const ${modelName.toLowerCase()}Service = new ${className}();
`;
}

function generateControllerOverride(
  modelName: string,
  generatedPath: string
): string {
  return `import * as generatedController from '${generatedPath}';

/**
 * ${modelName} Controller Override
 * 
 * Re-export generated handlers or override them with custom logic.
 */

// Re-export all generated handlers
export * from '${generatedPath}';

// Example: Override a specific handler
// export async function create${modelName}Handler(
//   request: FastifyRequest,
//   reply: FastifyReply
// ) {
//   // Custom logic
//   return generatedController.create${modelName}Handler(request, reply);
// }
`;
}

function generateRoutesOverride(
  modelName: string,
  generatedPath: string
): string {
  const modelLower = modelName.toLowerCase();

  return `import { FastifyInstance } from 'fastify';
import { ${modelLower}Routes as generated${modelName}Routes } from '${generatedPath}';

/**
 * ${modelName} Routes Override
 * 
 * This function extends or replaces the generated routes.
 */
export async function ${modelLower}Routes(app: FastifyInstance) {
  // Register generated routes
  await generated${modelName}Routes(app);

  // Add custom routes here
  // app.get('/custom', async () => {
  //   return { message: 'Custom route' };
  // });
}
`;
}

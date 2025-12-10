import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import {
  OldModelDefinition as ModelDefinition,
  Field,
  Relation,
} from '@allium/core';

export const generate = async (
  type: string | undefined,
  options: { definition?: string; model?: string; layer?: string }
) => {
  let genType = type;

  // If no type provided, prompt user to select
  if (!genType) {
    const { selectedType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedType',
        message: 'What would you like to generate?',
        choices: [
          { name: 'Model', value: 'model' },
          { name: 'Webhook', value: 'webhook' },
          { name: 'Cron Job', value: 'cronjob' },
          { name: 'Override (Service/Controller/Routes)', value: 'override' },
          { name: 'Controller', value: 'controller' },
          { name: 'Route', value: 'route' },
        ],
      },
    ]);
    genType = selectedType;
  }

  switch (genType) {
    case 'model':
      await generateModel(options);
      break;
    case 'webhook':
      await generateWebhook(options);
      break;
    case 'cronjob':
      await generateCronJob(options);
      break;
    case 'override':
      await generateOverride(options);
      break;
    case 'controller':
      await generateController();
      break;
    case 'route':
      await generateRoute();
      break;
    default:
      console.log(chalk.red(`Unknown generator type: ${genType}`));
      console.log(
        chalk.yellow(
          'Available types: model, webhook, cronjob, override, controller, route'
        )
      );
  }
};

async function generateModel(options: { definition?: string }) {
  let modelDef: ModelDefinition;

  if (options.definition) {
    try {
      modelDef = JSON.parse(options.definition);

      if (!modelDef.name) {
        throw new Error('modelName is required in definition');
      }
    } catch (e) {
      console.error(chalk.red('Invalid JSON definition provided.'));
      console.error(e);
      return;
    }
  } else {
    // Interactive mode
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'modelName',
        message: 'Model Name (e.g., Product):',
        validate: (input) => !!input || 'Model name is required',
      },
    ]);

    const fields: Field[] = [];

    // Quick definition mode
    const { quickDef } = await inquirer.prompt([
      {
        type: 'input',
        name: 'quickDef',
        message:
          'Quick Fields (e.g. name:String email:String:unique) [Enter to skip]:',
      },
    ]);

    if (quickDef && quickDef.trim().length > 0) {
      const parts = quickDef.trim().split(/\s+/);
      for (const part of parts) {
        const [name, type, ...modifiers] = part.split(':');

        if (!name || !type) {
          console.log(
            chalk.yellow(`Skipping invalid field definition: ${part}`)
          );
          continue;
        }

        const validTypes = [
          'String',
          'Int',
          'Float',
          'Boolean',
          'DateTime',
          'Json',
        ];
        const normalizedType = validTypes.find(
          (t) => t.toLowerCase() === type.toLowerCase()
        );

        if (!normalizedType) {
          console.log(
            chalk.yellow(
              `Invalid type '${type}' for field '${name}'. Supported: ${validTypes.join(
                ', '
              )}`
            )
          );
          continue;
        }

        fields.push({
          name,
          type: normalizedType as any,
          required: !modifiers.includes('?') && !modifiers.includes('optional'),
          unique: modifiers.includes('unique') || modifiers.includes('uniq'),
        });
      }
      console.log(
        chalk.green(`\nParsed ${fields.length} fields from quick definition.`)
      );
    }

    // Interactive mode fallback
    let addMoreFields = fields.length === 0;

    if (!addMoreFields) {
      const { addMore } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'addMore',
          message: 'Do you want to add more fields interactively?',
          default: false,
        },
      ]);
      addMoreFields = addMore;
    }

    if (addMoreFields) {
      console.log(chalk.blue('\nDefine Fields Interactively:'));
    }

    while (addMoreFields) {
      const field = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Field Name:',
          validate: (input) => !!input || 'Field name is required',
        },
        {
          type: 'list',
          name: 'type',
          message: 'Field Type:',
          choices: ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json'],
        },
        {
          type: 'confirm',
          name: 'required',
          message: 'Is this field required?',
          default: true,
        },
        {
          type: 'confirm',
          name: 'unique',
          message: 'Is this field unique?',
          default: false,
        },
      ]);

      fields.push(field);

      const { more } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'more',
          message: 'Add another field?',
          default: true,
        },
      ]);
      addMoreFields = more;
    }

    const relations: Relation[] = [];
    const { addRelations } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addRelations',
        message: 'Do you want to add relationships?',
        default: false,
      },
    ]);

    if (addRelations) {
      let addMoreRelations = true;
      console.log(chalk.blue('\nDefine Relationships:'));

      while (addMoreRelations) {
        const relation = await inquirer.prompt([
          {
            type: 'input',
            name: 'model',
            message: 'Related Model Name (e.g., User):',
            validate: (input) => !!input || 'Related model name is required',
          },
          {
            type: 'list',
            name: 'type',
            message: 'Relationship Type:',
            choices: [
              { name: 'One-to-One (1:1)', value: '1:1' },
              { name: 'One-to-Many (1:n)', value: '1:n' },
              { name: 'Many-to-Many (n:m)', value: 'n:m' },
            ],
          },
          {
            type: 'input',
            name: 'name',
            message: 'Field Name for Relation (e.g., author):',
            validate: (input) => !!input || 'Field name is required',
          },
        ]);

        relations.push(relation);

        const { more } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'more',
            message: 'Add another relationship?',
            default: false,
          },
        ]);
        addMoreRelations = more;
      }
    }

    modelDef = {
      name: answers.modelName,
      fields,
      relations,
      routes: {
        create: { path: `/${answers.modelName.toLowerCase()}` },
        read: { path: `/${answers.modelName.toLowerCase()}/:id` },
        update: { path: `/${answers.modelName.toLowerCase()}/:id` },
        delete: { path: `/${answers.modelName.toLowerCase()}/:id` },
        list: { path: `/${answers.modelName.toLowerCase()}` },
      },
    };
  }

  // Save model
  const projectRoot = process.cwd();

  // 1. Save JSON definition to .allium/models/
  const alliumModelsDir = path.join(projectRoot, '.allium', 'models');
  fs.ensureDirSync(alliumModelsDir);

  const jsonFileName = `${modelDef.name.toLowerCase()}.json`;
  const jsonFilePath = path.join(alliumModelsDir, jsonFileName);
  fs.writeFileSync(jsonFilePath, JSON.stringify(modelDef, null, 2));
  console.log(
    chalk.green(`✓ Created model definition: .allium/models/${jsonFileName}`)
  );

  // 2. Save TypeScript file to src/models/
  const modelsDir = path.join(projectRoot, 'src', 'models');
  fs.ensureDirSync(modelsDir);

  const modelFileName = `${modelDef.name.toLowerCase()}.model.ts`;
  const modelFilePath = path.join(modelsDir, modelFileName);

  const modelContent = `import { registerModel } from '@allium/core';

export const ${modelDef.name} = registerModel('${modelDef.name}', {
  functions: {
    // Add hooks here
    // beforeCreate: async (data, context) => {
    //   return data;
    // },
  },
});
`;

  fs.writeFileSync(modelFilePath, modelContent);
  console.log(chalk.green(`✓ Created model file: src/models/${modelFileName}`));

  // 3. Auto-update Prisma schema
  const schemaPath = path.join(
    projectRoot,
    '.allium',
    'prisma',
    'schema.prisma'
  );

  if (fs.existsSync(schemaPath)) {
    let schemaContent = fs.readFileSync(schemaPath, 'utf-8');

    // Check if model already exists in schema
    const modelRegex = new RegExp(`model\\s+${modelDef.name}\\s*{`, 'i');

    if (!modelRegex.test(schemaContent)) {
      // Generate Prisma model block
      const prismaModel = `
model ${modelDef.name} {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
${modelDef.fields
  .map((f) => {
    const fieldType =
      f.type === 'Int' || f.type === 'Float'
        ? f.type
        : f.type === 'DateTime'
        ? 'DateTime'
        : f.type === 'Boolean'
        ? 'Boolean'
        : f.type === 'Json'
        ? 'Json'
        : 'String';
    const optional = f.required ? '' : '?';
    const unique = f.unique ? ' @unique' : '';
    return `  ${f.name.padEnd(10)} ${fieldType}${optional}${unique}`;
  })
  .join('\n')}
}
`;

      // Append to schema
      schemaContent += prismaModel;
      fs.writeFileSync(schemaPath, schemaContent);
      console.log(
        chalk.green(
          `✓ Updated prisma/schema.prisma with ${modelDef.name} model`
        )
      );
    } else {
      console.log(
        chalk.yellow(
          `⚠ Model ${modelDef.name} already exists in schema.prisma, skipping update`
        )
      );
    }
  } else {
    console.log(
      chalk.yellow('⚠ prisma/schema.prisma not found, skipping schema update')
    );
  }

  console.log(chalk.yellow('\nNext steps:'));
  console.log('  1. Run: allium sync (to generate code from models)');
  console.log('  2. Run: allium db generate');
  console.log('  3. Run: allium db push');
}

async function generateOverride(options: { model?: string; layer?: string }) {
  const projectRoot = process.cwd();
  const modelsDir = path.join(projectRoot, '.allium', 'models');

  // Get available models for suggestions
  let availableModels: string[] = [];
  if (fs.existsSync(modelsDir)) {
    availableModels = fs
      .readdirSync(modelsDir)
      .filter((file) => file.endsWith('.json'))
      .map((file) => path.basename(file, '.json'));
  }

  const questions = [];

  if (!options.model) {
    if (availableModels.length > 0) {
      questions.push({
        type: 'list',
        name: 'model',
        message: 'Which model do you want to override?',
        choices: availableModels,
      });
    } else {
      questions.push({
        type: 'input',
        name: 'model',
        message: 'Which model do you want to override?',
        validate: (input: string) => !!input || 'Model name is required',
      });
    }
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
    projectRoot,
    'src',
    'modules',
    modelLower,
    'overrides'
  );

  fs.mkdirSync(overridePath, { recursive: true });

  const fileName = `${modelLower}.${layer}.ts`;
  const filePath = path.join(overridePath, fileName);

  if (fs.existsSync(filePath)) {
    console.log(chalk.yellow(`Override already exists: ${filePath}`));
    return;
  }

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
}

async function generateController() {
  console.log(chalk.blue('Generating generic controller...'));
  // Placeholder for generic controller generation logic
  // Could prompt for name and create a basic controller file
  const { name } = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Controller Name:',
    },
  ]);
  console.log(chalk.green(`Created controller: ${name}`));
}

async function generateRoute() {
  console.log(chalk.blue('Generating generic route...'));
  // Placeholder for generic route generation logic
  const { name } = await inquirer.prompt([
    {
      type: 'input',
      name: 'name',
      message: 'Route Name:',
    },
  ]);
  console.log(chalk.green(`Created route: ${name}`));
}

// --- Template Generators (Copied/Adapted from override.ts) ---

function generateServiceOverride(
  modelName: string,
  generatedPath: string
): string {
  const className = `${modelName}Service`;
  const generatedClassName = `Generated${className}`;

  return `import { ${className} as ${generatedClassName} } from '${generatedPath}';

/**
 * ${modelName} Service Override
 */
export class ${className} extends ${generatedClassName} {
  // Add custom methods or override existing ones here
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
 */

export * from '${generatedPath}';

// Example: Override a specific handler
// export async function create${modelName}Handler(req, reply) {
//   return generatedController.create${modelName}Handler(req, reply);
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
 */
export async function ${modelLower}Routes(app: FastifyInstance) {
  await generated${modelName}Routes(app);
  // Add custom routes here
}
`;
}

// Webhook generation
async function generateWebhook(options: { definition?: string }) {
  const { WebhookValidator } = await import('@allium/core');

  let webhookDef: any;

  if (options.definition) {
    webhookDef = JSON.parse(options.definition);
  } else {
    // Load available models
    const projectRoot = process.cwd();
    const modelsDir = path.join(projectRoot, '.allium', 'models');
    let modelChoices: Array<{ name: string; value: string }> = [];

    if (fs.existsSync(modelsDir)) {
      const modelFiles = fs
        .readdirSync(modelsDir)
        .filter((f) => f.endsWith('.json'));

      modelChoices = modelFiles.map((file) => {
        const modelName = path.basename(file, '.json');
        return { name: modelName, value: modelName.toLowerCase() };
      });
    }

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Webhook Name (e.g., user-events):',
        validate: (input) =>
          /^[a-z0-9-]+$/.test(input) ||
          'Use lowercase, alphanumeric, hyphens only',
      },
      {
        type: 'input',
        name: 'url',
        message: 'Webhook URL (or ${ENV_VAR}):',
        validate: (input) => !!input || 'URL is required',
      },
      {
        type: 'list',
        name: 'eventScope',
        message: 'Event scope:',
        choices: [
          { name: 'All events (*)', value: 'all' },
          { name: 'Specific models', value: 'models' },
          { name: 'Custom events', value: 'custom' },
        ],
      },
      {
        type: 'checkbox',
        name: 'selectedModels',
        message: 'Select models:',
        choices: modelChoices,
        when: (answers) => answers.eventScope === 'models',
        validate: (input) => input.length > 0 || 'Select at least one model',
      },
      {
        type: 'checkbox',
        name: 'eventTypes',
        message: 'Select event types:',
        choices: [
          { name: 'created', value: 'created' },
          { name: 'updated', value: 'updated' },
          { name: 'deleted', value: 'deleted' },
        ],
        when: (answers) => answers.eventScope === 'models',
        validate: (input) => input.length > 0 || 'Select at least one event type',
      },
      {
        type: 'input',
        name: 'customEvents',
        message: 'Custom events (comma-separated):',
        when: (answers) => answers.eventScope === 'custom',
        validate: (input) => !!input || 'Enter at least one event',
      },
      {
        type: 'confirm',
        name: 'active',
        message: 'Active?',
        default: true,
      },
      {
        type: 'input',
        name: 'secret',
        message: 'Secret (optional, or ${ENV_VAR}):',
      },
    ]);

    // Build events array based on selection
    let allEvents: string[] = [];
    if (answers.eventScope === 'all') {
      allEvents = ['*'];
    } else if (answers.eventScope === 'models') {
      // Generate events for selected models and event types
      for (const model of answers.selectedModels) {
        for (const eventType of answers.eventTypes) {
          allEvents.push(`${model}.${eventType}`);
        }
      }
    } else if (answers.eventScope === 'custom') {
      allEvents = answers.customEvents.split(',').map((e: string) => e.trim());
    }


    webhookDef = {
      name: answers.name,
      url: answers.url,
      events: allEvents,
      active: answers.active,
    };

    if (answers.secret) {
      webhookDef.secret = answers.secret;
    }
  }

  const validator = new WebhookValidator();
  const validation = validator.validate(webhookDef);
  if (!validation.valid) {
    console.error(chalk.red('Validation failed:'));
    validation.errors.forEach((err) => console.error(chalk.red(`  - ${err}`)));
    return;
  }

  const webhooksDir = path.join(process.cwd(), '.allium', 'webhooks');
  fs.ensureDirSync(webhooksDir);

  const fileName = `${webhookDef.name}.json`;
  const filePath = path.join(webhooksDir, fileName);

  if (fs.existsSync(filePath)) {
    console.log(chalk.yellow(`Webhook already exists: ${fileName}`));
    return;
  }

  fs.writeJsonSync(filePath, webhookDef, { spaces: 2 });
  console.log(chalk.green(`✓ Created webhook: .allium/webhooks/${fileName}`));
}

// Cron job generation
async function generateCronJob(options: { definition?: string }) {
  const { CronJobValidator } = await import('@allium/core');
  const cron = await import('node-cron');

  let cronDef: any;

  if (options.definition) {
    cronDef = JSON.parse(options.definition);
  } else {
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: 'Cron Job Name (e.g., daily-cleanup):',
        validate: (input) =>
          /^[a-z0-9-]+$/.test(input) ||
          'Use lowercase, alphanumeric, hyphens only',
      },
      {
        type: 'input',
        name: 'schedule',
        message: 'Cron Schedule (e.g., 0 2 * * *):',
        validate: (input) => {
          return cron.validate(input) || 'Invalid cron expression';
        },
      },
      {
        type: 'input',
        name: 'endpoint',
        message: 'Endpoint to call (e.g., /api/cleanup):',
        validate: (input) => !!input || 'Endpoint is required',
      },
      {
        type: 'list',
        name: 'method',
        message: 'HTTP Method:',
        choices: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
        default: 'POST',
      },
      {
        type: 'confirm',
        name: 'active',
        message: 'Active?',
        default: true,
      },
    ]);

    cronDef = answers;
  }

  const validator = new CronJobValidator();
  const validation = validator.validate(cronDef);
  if (!validation.valid) {
    console.error(chalk.red('Validation failed:'));
    validation.errors.forEach((err) => console.error(chalk.red(`  - ${err}`)));
    return;
  }

  const cronjobsDir = path.join(process.cwd(), '.allium', 'cronjobs');
  fs.ensureDirSync(cronjobsDir);

  const fileName = `${cronDef.name}.json`;
  const filePath = path.join(cronjobsDir, fileName);

  if (fs.existsSync(filePath)) {
    console.log(chalk.yellow(`Cron job already exists: ${fileName}`));
    return;
  }

  fs.writeJsonSync(filePath, cronDef, { spaces: 2 });
  console.log(chalk.green(`✓ Created cron job: .allium/cronjobs/${fileName}`));
}

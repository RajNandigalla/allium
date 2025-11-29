#!/usr/bin/env node
import { Command } from 'commander';
import { init } from './commands/init';
import { generate } from './commands/generate';
import { validate } from './commands/validate';
import { sync } from './commands/sync';
import { override } from './commands/override';
import { db } from './commands/db';
import figlet from 'figlet';
import chalk from 'chalk';

const program = new Command();

console.log(
  chalk.green(figlet.textSync('Allium', { horizontalLayout: 'full' }))
);

program
  .name('allium')
  .version('1.0.0')
  .description(
    'A powerful CLI for building type-safe REST APIs with auto-generated CRUD operations'
  )
  .addHelpText(
    'after',
    `
${chalk.bold('Quick Start:')}
  $ allium init my-api          Create a new project
  $ cd my-api && npm install    Install dependencies
  $ allium generate model       Create a new model
  $ allium sync                 Generate code from models
  $ allium db push              Push schema to database
  $ npm run dev                 Start development server

${chalk.bold('Documentation:')}
  https://github.com/RajNandigalla/allium/docs

${chalk.bold('Examples:')}
  $ allium init --name blog-api --db postgresql
  $ allium generate model --definition '{"name":"Post","fields":[...]}'
  $ allium override User service
`
  );

// INIT COMMAND
program
  .command('init')
  .description(
    'Initialize a new Allium project with database setup and example models'
  )
  .option('-n, --name <name>', 'Project name (default: my-allium-api)')
  .option(
    '-d, --db <database>',
    'Database type: postgresql, mysql, mongodb, sqlite (default: sqlite)'
  )
  .option(
    '-p, --path <path>',
    'Directory where the project should be created (default: current directory)'
  )
  .addHelpText(
    'after',
    `
${chalk.bold('Examples:')}
  $ allium init                                    # Interactive mode
  $ allium init --name blog-api                    # With project name
  $ allium init --name shop --db postgresql        # With database
  $ allium init --name api --db mysql --path ./apps # Custom path

${chalk.bold('What it creates:')}
  - Project structure with src/, .allium/ directories
  - package.json with dependencies
  - tsconfig.json for TypeScript
  - Prisma schema with example User model
  - .env file with database connection
  - Example model files

${chalk.bold('Next steps after init:')}
  1. cd <project-name>
  2. npm install
  3. allium db push
  4. npm run dev
`
  )
  .action(init);

// GENERATE COMMAND
program
  .command('generate [type]')
  .alias('g')
  .description('Generate resources: model, override, controller, or route')
  .option(
    '--definition <json>',
    'JSON definition of the model (for non-interactive mode)'
  )
  .option('-m, --model <name>', 'Model name (required for overrides)')
  .option(
    '-l, --layer <layer>',
    'Layer to override: service, controller, routes'
  )
  .addHelpText(
    'after',
    `
${chalk.bold('Available Types:')}
  model      - Generate a new model with fields and relations
  override   - Create an override file for customizing generated code
  controller - Generate a custom controller
  route      - Generate a custom route

${chalk.bold('Examples:')}
  $ allium generate                                # Interactive mode
  $ allium generate model                          # Generate model interactively
  $ allium g model                                 # Using alias
  $ allium generate override --model User --layer service
  
${chalk.bold('Quick Model Creation:')}
  $ allium generate model
  ? Model Name: Product
  ? Quick Fields: name:String price:Float stock:Int
  
${chalk.bold('JSON Definition:')}
  $ allium generate model --definition '{
    "name": "Product",
    "fields": [
      {"name": "title", "type": "String"},
      {"name": "price", "type": "Float"}
    ]
  }'

${chalk.bold('After generating:')}
  Run 'allium sync' to generate code from your models
`
  )
  .action(generate);

// VALIDATE COMMAND
program
  .command('validate')
  .description('Validate all model definitions in .allium/models/*.json')
  .addHelpText(
    'after',
    `
${chalk.bold('What it checks:')}
  - Valid JSON syntax
  - Required fields (name, fields)
  - Field type validity
  - Relation consistency
  - Unique constraints

${chalk.bold('Examples:')}
  $ allium validate                                # Validate all models

${chalk.bold('Common Issues:')}
  - Missing required fields
  - Invalid field types (use: String, Int, Float, Boolean, DateTime, Json)
  - Circular relations
  - Duplicate field names
`
  )
  .action(validate);

// SYNC COMMAND
program
  .command('sync')
  .description('Generate TypeScript code from model definitions')
  .option('--scaffold', 'Generate module scaffolding in src/modules (advanced)')
  .addHelpText(
    'after',
    `
${chalk.bold('What it does:')}
  - Reads models from .allium/models/*.json
  - Generates services, controllers, routes, schemas
  - Creates type-safe CRUD operations
  - Updates Prisma schema

${chalk.bold('Examples:')}
  $ allium sync                                    # Generate code
  $ allium sync --scaffold                         # With module scaffolding

${chalk.bold('Generated Files:')}
  .allium/generated/modules/{model}/
    ├── {model}.service.ts      - Database operations
    ├── {model}.controller.ts   - Request handlers
    ├── {model}.routes.ts       - Route definitions
    ├── {model}.schema.ts       - Validation schemas
    └── {model}.resolver.ts     - GraphQL resolvers

${chalk.bold('After sync:')}
  Run 'allium db generate' to update Prisma client
  Run 'allium db push' to update database schema
`
  )
  .action(sync);

// DB COMMAND
program
  .command('db [command]')
  .description('Database operations: push, generate, studio')
  .addHelpText(
    'after',
    `
${chalk.bold('Available Commands:')}
  push      - Push schema changes to database (no migration)
  generate  - Generate Prisma Client
  studio    - Open Prisma Studio (database GUI)

${chalk.bold('Examples:')}
  $ allium db push                                 # Update database schema
  $ allium db generate                             # Regenerate Prisma Client
  $ allium db studio                               # Open database GUI

${chalk.bold('Workflow:')}
  1. Update models in .allium/models/
  2. Run 'allium sync' to update Prisma schema
  3. Run 'allium db generate' to update client
  4. Run 'allium db push' to update database

${chalk.bold('Note:')}
  'db push' is for development. For production, use Prisma migrations.
`
  )
  .action(db);

// OVERRIDE COMMAND
program
  .command('override <model> <layer>')
  .description(
    'Create an override file to customize generated code for a specific model layer'
  )
  .addHelpText(
    'after',
    `
${chalk.bold('Available Layers:')}
  service    - Override database operations
  controller - Override request handlers
  routes     - Override route definitions

${chalk.bold('Examples:')}
  $ allium override User service                   # Override User service
  $ allium override Post controller                # Override Post controller
  $ allium override Product routes                 # Override Product routes

${chalk.bold('What it creates:')}
  src/modules/{model}/overrides/{model}.{layer}.ts

${chalk.bold('Use Cases:')}
  - Add custom business logic
  - Modify default CRUD operations
  - Add custom validation
  - Integrate third-party services

${chalk.bold('After creating override:')}
  Run 'allium sync' to regenerate index exports
`
  )
  .action((model, layer) => override({ model, layer }));

program.parse(process.argv);

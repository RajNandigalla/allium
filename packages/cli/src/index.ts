#!/usr/bin/env node
import { Command } from 'commander';
import { init } from './commands/init';
import { generate } from './commands/generate';
import { validate } from './commands/validate';
import { sync } from './commands/sync';
import { override } from './commands/override';
import figlet from 'figlet';
import chalk from 'chalk';

const program = new Command();

console.log(
  chalk.green(figlet.textSync('Allium', { horizontalLayout: 'full' }))
);

program.version('1.0.0').description('CLI scaffolding tool for creating APIs');

program
  .command('init')
  .description('Initialize a new Allium project')
  .option('-n, --name <name>', 'Project name')
  .option(
    '-d, --db <database>',
    'Database type (postgresql, mysql, mongodb, sqlite)'
  )
  .option('-p, --path <path>', 'Directory where the project should be created')
  .action(init);

program
  .command('generate [type]')
  .alias('g')
  .description('Generate resources (model, override, controller, route)')
  .option('--definition <json>', 'JSON definition of the model')
  .option('-m, --model <name>', 'Model name (for overrides)')
  .option(
    '-l, --layer <layer>',
    'Layer to override (service, controller, routes)'
  )
  .action(generate);

program
  .command('validate')
  .description('Validate all model definitions')
  .action(validate);

program
  .command('sync')
  .description('Generate code from model definitions')
  .action(sync);

program
  .command('override <model> <layer>')
  .description(
    'Create an override file for a model layer (service, controller, routes)'
  )
  .action((model, layer) => override({ model, layer }));

program.parse(process.argv);

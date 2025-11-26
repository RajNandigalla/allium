#!/usr/bin/env node
import { Command } from 'commander';
import { init } from './commands/init';
import { generate } from './commands/generate';
import { validate } from './commands/validate';
import { sync } from './commands/sync';
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
  .action(init);

program
  .command('generate')
  .alias('g')
  .description('Generate a new API resource (creates JSON model file)')
  .option('--definition <json>', 'JSON definition of the model')
  .action(generate);

program
  .command('validate')
  .description('Validate all model definitions')
  .action(validate);

program
  .command('sync')
  .description('Generate code from model definitions')
  .action(sync);

program.parse(process.argv);

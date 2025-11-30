import chalk from 'chalk';
import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs-extra';
import inquirer from 'inquirer';

export const db = async (command: string, options: any) => {
  const projectRoot = process.cwd();
  const schemaPath = path.join(
    projectRoot,
    '.allium',
    'prisma',
    'schema.prisma'
  );

  if (!fs.existsSync(schemaPath)) {
    console.error(chalk.red(`Error: Schema not found at ${schemaPath}`));
    console.error(chalk.yellow('Run "allium init" or "allium sync" first.'));
    process.exit(1);
  }

  let prismaCommand = '';

  // Extract extra args passed after --
  const extraArgs = options?.args || [];
  const flags = extraArgs.join(' ');

  switch (command) {
    case 'push':
      console.log(chalk.blue('Pushing schema to database...'));
      prismaCommand = `npx prisma db push --schema "${schemaPath}" ${flags}`;
      break;
    case 'generate':
      console.log(chalk.blue('Generating Prisma client...'));
      prismaCommand = `npx prisma generate --schema "${schemaPath}"`;
      break;
    case 'studio':
      console.log(chalk.blue('Opening Prisma Studio...'));
      prismaCommand = `npx prisma studio --schema "${schemaPath}"`;
      break;
    default:
      if (!command) {
        const { selectedCommand } = await inquirer.prompt([
          {
            type: 'list',
            name: 'selectedCommand',
            message: 'What would you like to do?',
            choices: [
              { name: 'Push (Sync DB with schema)', value: 'push' },
              { name: 'Generate (Update client)', value: 'generate' },
              { name: 'Studio (Open DB GUI)', value: 'studio' },
            ],
          },
        ]);
        return db(selectedCommand, options);
      }
      console.error(chalk.red(`Unknown db command: ${command}`));
      console.log(chalk.yellow('Available commands: push, generate, studio'));
      process.exit(1);
  }

  try {
    execSync(prismaCommand, { stdio: 'inherit' });
  } catch (error) {
    console.error(chalk.red('Command failed.'));
    process.exit(1);
  }
};

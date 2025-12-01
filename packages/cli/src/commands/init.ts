import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import { execSync } from 'child_process';
import { generateReadme } from '../templates/readme';

export const init = async (options: {
  name?: string;
  db?: string;
  path?: string;
}) => {
  const questions = [];

  if (!options.name) {
    questions.push({
      type: 'input',
      name: 'projectName',
      message: 'What is the name of your project?',
      default: 'my-allium-api',
    });
  }

  if (!options.db) {
    questions.push({
      type: 'list',
      name: 'database',
      message: 'Which database would you like to use?',
      choices: ['postgresql', 'mysql', 'mongodb', 'sqlite'],
    });
  }

  const answers = await inquirer.prompt(questions);

  const projectName = options.name || answers.projectName;
  const database = options.db || answers.database;

  // Resolve path - note: in yarn workspaces, relative paths resolve from workspace root
  const basePath = options.path ? path.resolve(options.path) : process.cwd();
  const projectPath = path.join(basePath, projectName);

  // Helpful message if using relative path in workspace
  if (options.path && !path.isAbsolute(options.path)) {
    console.log(
      chalk.yellow(
        `Note: Relative paths resolve from workspace root when using yarn.`
      )
    );
    console.log(chalk.yellow(`Creating project in: ${projectPath}\n`));
  }

  if (fs.existsSync(projectPath)) {
    console.log(chalk.red(`Directory ${projectName} already exists.`));
    return;
  }

  const spinner = ora('Scaffolding project...').start();

  try {
    // 1. Create directory
    fs.mkdirSync(projectPath, { recursive: true });

    // 2. Create package.json
    const packageJson: any = {
      name: `@allium/${projectName}`,
      version: '1.0.0',
      scripts: {
        dev: 'ts-node-dev --transpile-only src/app.ts',
        build: 'tsc',
        start: 'node dist/app.js',
      },
      dependencies: {
        '@allium/core': '*',
        '@allium/fastify': '*',
        '@prisma/client': '^7.0.0',
        dotenv: '^16.3.1',
      },
      devDependencies: {
        typescript: '^5.2.2',
        '@types/node': '^20.9.0',
        'ts-node': '^10.9.1',
        'ts-node-dev': '^2.0.0',
        prisma: '^7.0.0',
      },
    };

    if (database === 'sqlite') {
      packageJson.dependencies['@prisma/adapter-better-sqlite3'] = '^7.0.0';
      packageJson.dependencies['better-sqlite3'] = '^11.0.0';
      packageJson.devDependencies['@types/better-sqlite3'] = '^7.6.0';
    } else if (database === 'postgresql') {
      packageJson.dependencies['@prisma/adapter-pg'] = '^7.0.0';
      packageJson.dependencies['pg'] = '^8.11.0';
      packageJson.devDependencies['@types/pg'] = '^8.10.0';
    }

    fs.writeFileSync(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // 3. Create tsconfig.json
    const tsConfig = {
      extends: '../../tsconfig.json',
      compilerOptions: {
        outDir: './dist',
        rootDir: './src',
        composite: true,
        skipLibCheck: true,
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist'],
      references: [{ path: '../core' }, { path: '../fastify' }],
    };

    fs.writeFileSync(
      path.join(projectPath, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );

    // 4. Create src structure
    fs.mkdirSync(path.join(projectPath, 'src'));
    fs.mkdirSync(path.join(projectPath, 'src', 'models'));

    // 5. Create app.ts
    const appTs = `import 'dotenv/config';
import path from 'path';
import { autoLoadModels } from '@allium/core';
import { initAllium } from '@allium/fastify';

const start = async () => {
  try {
    // Auto-load all models from src/models/
    const models = await autoLoadModels(path.join(__dirname, 'models'));

    const app = await initAllium({
      models,
      modelsDir: path.join(__dirname, 'models'),
      autoSync: true,
      prisma: {
        datasourceUrl: process.env.DATABASE_URL,
        provider: '${database}'
      }
    });

    await app.listen({ port: 3000 });
    console.log('Server running at http://localhost:3000');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
`;
    fs.writeFileSync(path.join(projectPath, 'src', 'app.ts'), appTs);

    // 6. Create example model
    const exampleModel = `import { registerModel } from '@allium/core';

export const User = registerModel('User', {
  functions: {
    beforeCreate: async (data, context) => {
      // Example hook
      return data;
    },
  },
});
`;
    fs.writeFileSync(
      path.join(projectPath, 'src', 'models', 'user.model.ts'),
      exampleModel
    );

    // 6b. Create example model JSON definition
    const alliumModelsDir = path.join(projectPath, '.allium', 'models');
    fs.mkdirSync(alliumModelsDir, { recursive: true });

    const userJson = {
      name: 'User',
      fields: [
        { name: 'email', type: 'String', unique: true },
        { name: 'name', type: 'String', required: false },
      ],
      routes: {
        create: { path: '/users' },
        read: { path: '/users/:id' },
        update: { path: '/users/:id' },
        delete: { path: '/users/:id' },
        list: { path: '/users' },
      },
    };

    fs.writeFileSync(
      path.join(alliumModelsDir, 'user.json'),
      JSON.stringify(userJson, null, 2)
    );

    // 7. Create Prisma schema
    const prismaDir = path.join(projectPath, '.allium', 'prisma');
    fs.mkdirSync(prismaDir, { recursive: true });
    const prismaSchema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${database}"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;
    fs.writeFileSync(path.join(prismaDir, 'schema.prisma'), prismaSchema);

    // 8. Create .env
    let envContent = '';

    switch (database) {
      case 'postgresql':
        envContent = `DATABASE_URL="postgresql://user:password@localhost:5432/${projectName}?schema=public"`;
        break;
      case 'mysql':
        envContent = `DATABASE_URL="mysql://user:password@localhost:3306/${projectName}"`;
        break;
      case 'mongodb':
        envContent = `DATABASE_URL="mongodb://localhost:27017/${projectName}"`;
        break;
      case 'sqlite':
      default:
        envContent = `DATABASE_URL="file:./test.db"`;
        break;
    }

    fs.writeFileSync(path.join(projectPath, '.env'), envContent);

    // 9. Create prisma.config.js
    const prismaConfig = `require('dotenv').config();

module.exports = {
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
`;
    fs.writeFileSync(path.join(projectPath, 'prisma.config.js'), prismaConfig);

    // Generate README.md
    const readmeContent = generateReadme({
      projectName,
      database,
      hasModels: true,
    });
    fs.writeFileSync(path.join(projectPath, 'README.md'), readmeContent);

    spinner.succeed(
      chalk.green(`Project ${projectName} created successfully!`)
    );
    console.log(chalk.yellow('\nNext steps:'));
    console.log(`  cd ${projectName}`);
    console.log('  npm install');
    console.log('  npx allium db push');
    console.log('  npm run dev');
  } catch (error) {
    spinner.fail(chalk.red('Failed to scaffold project.'));
    console.error(error);
  }
};

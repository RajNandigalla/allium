import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import ora from 'ora';
import { execSync } from 'child_process';

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
      name: projectName,
      version: '1.0.0',
      scripts: {
        dev: 'ts-node-dev --respawn --transpile-only src/app.ts',
        build: 'tsc',
        start: 'node dist/app.js',
        'prisma:generate': 'prisma generate',
        'prisma:push': 'prisma db push',
      },
      dependencies: {
        '@allium/core': '^0.1.0',
        '@allium/fastify': '^0.1.0',
        '@prisma/client': '^7.0.0',
        fastify: '^4.24.3',
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
      compilerOptions: {
        target: 'ES2020',
        module: 'commonjs',
        outDir: './dist',
        rootDir: '.',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        forceConsistentCasingInFileNames: true,
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist'],
    };

    fs.writeFileSync(
      path.join(projectPath, 'tsconfig.json'),
      JSON.stringify(tsConfig, null, 2)
    );

    // 4. Create src structure
    fs.mkdirSync(path.join(projectPath, 'src'));
    fs.mkdirSync(path.join(projectPath, 'src', 'models'));

    // 5. Create app.ts
    const appTs = `import { createAlliumApp } from '@allium/fastify';
import 'dotenv/config';

// Import models
// import { Product } from './models/product.model';

const start = async () => {
  try {
    const app = await createAlliumApp({
      models: [
        // Product,
      ],
      swagger: true,
    });

    const port = Number(process.env.PORT) || 3000;
    await app.listen({ port });
    console.log(\`Server running on http://localhost:\${port}\`);
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
  beforeCreate: async (data, context) => {
    // Example hook
    return data;
  },
});
`;
    fs.writeFileSync(
      path.join(projectPath, 'src', 'models', 'user.model.ts'),
      exampleModel
    );

    // 7. Create Prisma schema
    fs.mkdirSync(path.join(projectPath, 'prisma'));
    const prismaSchema = `generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "${database}"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
`;
    fs.writeFileSync(
      path.join(projectPath, 'prisma', 'schema.prisma'),
      prismaSchema
    );

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
        envContent = `DATABASE_URL="file:./dev.db"`;
        break;
    }

    fs.writeFileSync(path.join(projectPath, '.env'), envContent);

    spinner.succeed(
      chalk.green(`Project ${projectName} created successfully!`)
    );
    console.log(chalk.yellow('\nNext steps:'));
    console.log(`  cd ${projectName}`);
    console.log('  npm install');
    console.log('  npx prisma db push');
    console.log('  npm run dev');
  } catch (error) {
    spinner.fail(chalk.red('Failed to scaffold project.'));
    console.error(error);
  }
};

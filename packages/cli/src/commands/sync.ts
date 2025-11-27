import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import {
  ModelValidator,
  generatePrismaSchema,
  generateModuleFiles,
} from '@allium/core';

export const sync = async () => {
  const spinner = ora('Syncing models...').start();
  const validator = new ModelValidator();

  try {
    const projectRoot = process.cwd();

    // Step 1: Validate
    spinner.text = 'Validating models...';
    const validationResult = await validator.validateProject(projectRoot);

    if (!validationResult.valid) {
      spinner.fail(chalk.red('Validation failed'));
      validator.printErrors(validationResult.errors);
      process.exit(1);
    }

    // Step 2: Generate aggregated schema
    spinner.text = 'Generating schema...';
    const schema = await validator.generateAggregatedSchema(projectRoot);
    fs.writeFileSync(
      path.join(projectRoot, '.allium', 'schema.json'),
      JSON.stringify(schema, null, 2)
    );

    // Step 3: Generate Prisma schema
    spinner.text = 'Generating Prisma schema...';

    // Read existing schema to preserve the database provider
    const schemaPath = path.join(projectRoot, 'prisma', 'schema.prisma');
    let existingProvider: string | undefined;

    if (fs.existsSync(schemaPath)) {
      const existingSchema = fs.readFileSync(schemaPath, 'utf-8');
      // Extract provider from existing schema using regex
      const providerMatch = existingSchema.match(/provider\s*=\s*"([^"]+)"/);
      if (providerMatch && providerMatch[1] !== 'prisma-client-js') {
        existingProvider = providerMatch[1];
      }
    }

    const prismaSchema = generatePrismaSchema(schema, existingProvider);
    fs.writeFileSync(schemaPath, prismaSchema);

    // Step 4: Generate module files
    spinner.text = 'Generating modules...';
    for (const model of schema.models) {
      await generateModuleFiles(projectRoot, model);
    }

    spinner.succeed(
      chalk.green(`Successfully synced ${schema.models.length} model(s)!`)
    );

    console.log(chalk.yellow('\nNext steps:'));
    console.log('  1. Run: npx prisma generate');
    console.log('  2. Run: npx prisma db push (or prisma migrate dev)');
    console.log('  3. Register routes in src/app.ts');
  } catch (error) {
    spinner.fail(chalk.red('Sync failed'));
    console.error(error);
    process.exit(1);
  }
};

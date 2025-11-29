import chalk from 'chalk';
import ora from 'ora';
import fs from 'fs-extra';
import path from 'path';
import {
  ModelValidator,
  generatePrismaSchema,
  generateModuleFiles,
} from '@allium/core';

export const sync = async (options?: { scaffold?: boolean }) => {
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
    const schemaPath = path.join(
      projectRoot,
      '.allium',
      'prisma',
      'schema.prisma'
    );
    // Ensure directory exists
    fs.ensureDirSync(path.dirname(schemaPath));
    let existingProvider: string | undefined;

    // Try to read provider from prisma.config.js first
    const prismaConfigPath = path.join(projectRoot, 'prisma.config.js');
    if (fs.existsSync(prismaConfigPath)) {
      try {
        const prismaConfig = require(prismaConfigPath);
        if (prismaConfig?.prisma?.provider) {
          existingProvider = prismaConfig.prisma.provider;
        }
      } catch (error) {
        // Ignore error if config cannot be loaded (e.g. missing dependencies)
      }
    }

    // Fallback to existing schema if provider not found in config
    if (!existingProvider && fs.existsSync(schemaPath)) {
      const existingSchema = fs.readFileSync(schemaPath, 'utf-8');
      // Extract provider from datasource block
      const providerMatch = existingSchema.match(
        /datasource\s+\w+\s+\{[\s\S]*?provider\s*=\s*"([^"]+)"/
      );
      if (providerMatch) {
        existingProvider = providerMatch[1];
      }
    }

    const prismaSchema = generatePrismaSchema(schema, existingProvider);
    fs.writeFileSync(schemaPath, prismaSchema);

    // Step 4: Generate module files (optional)
    if (options?.scaffold) {
      spinner.text = 'Generating modules...';
      for (const model of schema.models) {
        await generateModuleFiles(projectRoot, model);
      }
    }

    spinner.succeed(
      chalk.green(`Successfully synced ${schema.models.length} model(s)!`)
    );

    console.log(chalk.yellow('\nNext steps:'));
    console.log('  1. Run: allium db generate');
    console.log('  2. Run: allium db push');
    console.log('  3. Register routes in src/app.ts');
  } catch (error) {
    spinner.fail(chalk.red('Sync failed'));
    console.error(error);
    process.exit(1);
  }
};

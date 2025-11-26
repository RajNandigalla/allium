import chalk from 'chalk';
import ora from 'ora';
import { ModelValidator } from '../validators/model-validator';

export const validate = async () => {
  const spinner = ora('Validating models...').start();
  const validator = new ModelValidator();

  try {
    const result = await validator.validateProject(process.cwd());

    if (result.valid) {
      spinner.succeed(chalk.green('All models are valid!'));

      // Generate aggregated schema
      const schema = await validator.generateAggregatedSchema(process.cwd());
      console.log(chalk.blue(`\nFound ${schema.models.length} model(s):`));
      schema.models.forEach((m) => console.log(chalk.cyan(`  - ${m.name}`)));
    } else {
      spinner.fail(chalk.red('Validation failed'));
      validator.printErrors(result.errors);
      process.exit(1);
    }
  } catch (error) {
    spinner.fail(chalk.red('Validation error'));
    console.error(error);
    process.exit(1);
  }
};

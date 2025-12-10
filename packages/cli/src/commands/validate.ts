import chalk from 'chalk';
import ora from 'ora';
import {
  ModelValidator,
  WebhookValidator,
  CronJobValidator,
} from '@allium/core';

export const validate = async () => {
  const spinner = ora('Validating project...').start();

  const modelValidator = new ModelValidator();
  const webhookValidator = new WebhookValidator();
  const cronValidator = new CronJobValidator();

  try {
    const [modelResult, webhookResult, cronResult] = await Promise.all([
      modelValidator.validateProject(process.cwd()),
      webhookValidator.validateAll(process.cwd()),
      cronValidator.validateAll(process.cwd()),
    ]);

    const allValid =
      modelResult.valid && webhookResult.valid && cronResult.valid;

    if (allValid) {
      spinner.succeed(chalk.green('All validations passed!'));

      // Models
      const schema = await modelValidator.generateAggregatedSchema(
        process.cwd()
      );
      console.log(chalk.blue(`\nModels: ${schema.models.length}`));
      schema.models.forEach((m) => console.log(chalk.cyan(`  - ${m.name}`)));

      // Webhooks
      if (webhookResult.count > 0) {
        console.log(chalk.blue(`\nWebhooks: ${webhookResult.count}`));
      }

      // Cron Jobs
      if (cronResult.count > 0) {
        console.log(chalk.blue(`Cron Jobs: ${cronResult.count}`));
      }
    } else {
      spinner.fail(chalk.red('Validation failed'));

      if (!modelResult.valid) {
        console.log(chalk.red('\nModel Errors:'));
        modelValidator.printErrors(modelResult.errors);
      }

      if (!webhookResult.valid) {
        console.log(chalk.red('\nWebhook Errors:'));
        webhookResult.errors.forEach((err: any) => {
          console.log(chalk.red(`  ${err.file}:`));
          err.errors.forEach((e: string) =>
            console.log(chalk.red(`    - ${e}`))
          );
        });
      }

      if (!cronResult.valid) {
        console.log(chalk.red('\nCron Job Errors:'));
        cronResult.errors.forEach((err: any) => {
          console.log(chalk.red(`  ${err.file}:`));
          err.errors.forEach((e: string) =>
            console.log(chalk.red(`    - ${e}`))
          );
        });
      }

      process.exit(1);
    }
  } catch (error) {
    spinner.fail(chalk.red('Validation error'));
    console.error(error);
    process.exit(1);
  }
};

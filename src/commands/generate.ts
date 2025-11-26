import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { ModelDefinition, Field, Relation } from '../types/model';

export const generate = async (options: { definition?: string }) => {
  let modelDef: ModelDefinition;

  if (options.definition) {
    try {
      modelDef = JSON.parse(options.definition);

      if (!modelDef.name) {
        throw new Error('modelName is required in definition');
      }
    } catch (e) {
      console.error(chalk.red('Invalid JSON definition provided.'));
      console.error(e);
      return;
    }
  } else {
    // Interactive mode
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'modelName',
        message: 'Model Name (e.g., Product):',
        validate: (input) => !!input || 'Model name is required',
      },
    ]);

    const fields: Field[] = [];
    let addMoreFields = true;

    console.log(chalk.blue('\nDefine Fields:'));

    while (addMoreFields) {
      const field = await inquirer.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Field Name:',
          validate: (input) => !!input || 'Field name is required',
        },
        {
          type: 'list',
          name: 'type',
          message: 'Field Type:',
          choices: ['String', 'Int', 'Float', 'Boolean', 'DateTime', 'Json'],
        },
        {
          type: 'confirm',
          name: 'required',
          message: 'Is this field required?',
          default: true,
        },
        {
          type: 'confirm',
          name: 'unique',
          message: 'Is this field unique?',
          default: false,
        },
      ]);

      fields.push(field);

      const { more } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'more',
          message: 'Add another field?',
          default: true,
        },
      ]);
      addMoreFields = more;
    }

    const relations: Relation[] = [];
    const { addRelations } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addRelations',
        message: 'Do you want to add relationships?',
        default: false,
      },
    ]);

    if (addRelations) {
      let addMoreRelations = true;
      console.log(chalk.blue('\nDefine Relationships:'));

      while (addMoreRelations) {
        const relation = await inquirer.prompt([
          {
            type: 'input',
            name: 'model',
            message: 'Related Model Name (e.g., User):',
            validate: (input) => !!input || 'Related model name is required',
          },
          {
            type: 'list',
            name: 'type',
            message: 'Relationship Type:',
            choices: [
              { name: 'One-to-One (1:1)', value: '1:1' },
              { name: 'One-to-Many (1:n)', value: '1:n' },
              { name: 'Many-to-Many (n:m)', value: 'n:m' },
            ],
          },
          {
            type: 'input',
            name: 'name',
            message: 'Field Name for Relation (e.g., author):',
            validate: (input) => !!input || 'Field name is required',
          },
        ]);

        relations.push(relation);

        const { more } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'more',
            message: 'Add another relationship?',
            default: false,
          },
        ]);
        addMoreRelations = more;
      }
    }

    modelDef = {
      name: answers.modelName,
      fields,
      relations,
    };
  }

  // Save model to .allium/models/{ModelName}.json
  const projectRoot = process.cwd();
  const modelsDir = path.join(projectRoot, '.allium', 'models');
  fs.mkdirSync(modelsDir, { recursive: true });

  const modelPath = path.join(modelsDir, `${modelDef.name}.json`);
  fs.writeFileSync(modelPath, JSON.stringify(modelDef, null, 2));

  console.log(chalk.green(`\n✔ Model definition saved to ${modelPath}`));
  console.log(chalk.yellow('\nNext steps:'));
  console.log('  1. Run: allium validate (to validate all models)');
  console.log('  2. Run: allium sync (to generate code from models)');
};

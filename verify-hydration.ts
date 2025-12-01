import path from 'path';
import fs from 'fs';
import { registerModel } from './packages/core/src/runtime/register-model';
import { autoLoadModels } from './packages/core/src/utils/model-loader';

// Mock setup
const TEST_DIR = path.join(__dirname, '.test-hydration');
const MODELS_DIR = path.join(TEST_DIR, 'src', 'models');
const ALLIUM_DIR = path.join(TEST_DIR, '.allium');
const SCHEMA_PATH = path.join(ALLIUM_DIR, 'schema.json');

async function runTest() {
  console.log('Setting up test environment...');
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(MODELS_DIR, { recursive: true });
  fs.mkdirSync(ALLIUM_DIR, { recursive: true });

  // 1. Create JSON Schema (Source of Truth)
  const schema = {
    models: [
      {
        name: 'TestUser',
        fields: [{ name: 'email', type: 'String' }],
        hooks: { beforeCreate: 'hashPassword' }, // Reference to function
      },
    ],
  };
  fs.writeFileSync(SCHEMA_PATH, JSON.stringify(schema, null, 2));

  // 2. Create TS Model (Function Provider)
  const tsContent = `
    const { registerModel } = require('../../../packages/core/src/runtime/register-model');
    
    const hashPassword = async (data) => {
      console.log('Hashing password for', data.email);
      return data;
    };

    module.exports = {
      TestUser: registerModel('TestUser', {
        functions: {
          hashPassword
        }
      })
    };
  `;
  fs.writeFileSync(path.join(MODELS_DIR, 'user.model.js'), tsContent);

  console.log('Running autoLoadModels...');

  // We need to make sure require paths in the generated file work.
  // Since we are running from root, and the file is deep, relative paths might be tricky.
  // But we are using absolute path for modelsDir in autoLoadModels.

  try {
    const models = await autoLoadModels(MODELS_DIR);

    console.log('Loaded models:', models.length);
    const userModel = models.find((m) => m.name === 'TestUser');

    if (!userModel) {
      console.error('TestUser model not found!');
      process.exit(1);
    }

    console.log('User model found.');
    console.log('Functions:', Object.keys(userModel.functions || {}));

    if (userModel.functions && userModel.functions.hashPassword) {
      console.log('SUCCESS: hashPassword function is bound.');
      // Verify execution
      await userModel.functions.hashPassword({ email: 'test@example.com' });
    } else {
      console.error('FAILURE: hashPassword function is missing.');
      process.exit(1);
    }
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    // Cleanup
    // fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

runTest();

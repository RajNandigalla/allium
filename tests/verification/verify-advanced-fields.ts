import path from 'path';
import fs from 'fs';
import { autoLoadModels } from './packages/core/src/utils/model-loader';
import { applyMasking } from './packages/fastify/src/utils/masked-fields';
import { addComputedFields } from './packages/fastify/src/utils/computed-fields';

// Mock setup
const TEST_DIR = path.join(__dirname, '.test-advanced');
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

  // 1. Create JSON Schema with advanced fields
  const schema = {
    models: [
      {
        name: 'TestUser',
        fields: [
          { name: 'email', type: 'String' },
          { name: 'secret', type: 'String', masked: 'customMask' },
          { name: 'price', type: 'Float' },
          {
            name: 'priceWithTax',
            type: 'Float',
            computed: { transform: 'calculateTax' },
          },
        ],
      },
    ],
  };
  fs.writeFileSync(SCHEMA_PATH, JSON.stringify(schema, null, 2));

  // 2. Create TS Model with functions
  const tsContent = `
    const { registerModel } = require('../../../packages/core/src/runtime/register-model');
    
    const customMask = (val) => 'MASKED-' + val;
    const calculateTax = (record) => record.price * 1.2;

    module.exports = {
      TestUser: registerModel('TestUser', {
        functions: {
          customMask,
          calculateTax
        }
      })
    };
  `;
  fs.writeFileSync(path.join(MODELS_DIR, 'user.model.js'), tsContent);

  console.log('Running autoLoadModels...');

  try {
    const models = await autoLoadModels(MODELS_DIR);
    const userModel = models.find((m) => m.name === 'TestUser');

    if (!userModel) {
      console.error('TestUser model not found!');
      process.exit(1);
    }

    // Test Data
    const record = {
      email: 'test@example.com',
      secret: 'supersecret',
      price: 100,
    };

    // Test Masking
    console.log('Testing Masking...');
    const maskedRecord = applyMasking(record, userModel);
    console.log('Masked Result:', maskedRecord.secret);

    if (maskedRecord.secret === 'MASKED-supersecret') {
      console.log('SUCCESS: Custom masking worked.');
    } else {
      console.error(
        'FAILURE: Custom masking failed. Got:',
        maskedRecord.secret
      );
      process.exit(1);
    }

    // Test Computed Fields
    console.log('Testing Computed Fields...');
    const computedRecord = addComputedFields(record, userModel);
    console.log('Computed Result:', computedRecord.priceWithTax);

    if (computedRecord.priceWithTax === 120) {
      console.log('SUCCESS: Computed transform worked.');
    } else {
      console.error(
        'FAILURE: Computed transform failed. Got:',
        computedRecord.priceWithTax
      );
      process.exit(1);
    }
  } catch (error) {
    console.error('Test failed:', error);
    process.exit(1);
  } finally {
    // fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

runTest();

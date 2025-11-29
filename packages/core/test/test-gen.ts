import { generateModuleFiles } from '../src/generators/module-generator';
import { ModelDefinition } from '../src/types/model';
import fs from 'fs-extra';
import path from 'path';

const testModel: ModelDefinition = {
  name: 'TestGen',
  fields: [{ name: 'name', type: 'String' }],
};

const testDir = path.join(__dirname, 'test-gen-output');

async function run() {
  await fs.ensureDir(testDir);
  await generateModuleFiles(testDir, testModel);

  const modelFile = path.join(testDir, 'src', 'models', 'testgen.model.ts');
  if (fs.existsSync(modelFile)) {
    const content = fs.readFileSync(modelFile, 'utf-8');
    console.log('Generated Model Content:');
    console.log(content);
    if (content.includes('routes: {')) {
      console.log('SUCCESS: Routes configuration found in generated file.');
    } else {
      console.error('FAILURE: Routes configuration NOT found.');
    }
  } else {
    console.error('FAILURE: Model file not generated.');
  }

  // Cleanup
  await fs.remove(testDir);
}

run().catch(console.error);

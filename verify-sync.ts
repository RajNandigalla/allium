import path from 'path';
import fs from 'fs';
import { sync } from './packages/cli/src/commands/sync';

// Mock setup
const TEST_DIR = path.join(__dirname, '.test-sync');
const ALLIUM_DIR = path.join(TEST_DIR, '.allium');
const MODELS_DIR = path.join(ALLIUM_DIR, 'models');

async function runTest() {
  console.log('Setting up test environment for sync...');
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(MODELS_DIR, { recursive: true });

  // 1. Create JSON Model (Source of Truth)
  const userModel = {
    name: 'TestUser',
    fields: [
      { name: 'id', type: 'String', unique: true, default: 'cuid()' },
      { name: 'email', type: 'String', unique: true },
    ],
  };
  fs.writeFileSync(
    path.join(MODELS_DIR, 'testuser.json'),
    JSON.stringify(userModel, null, 2)
  );

  // Mock process.cwd
  const originalCwd = process.cwd;
  process.cwd = () => TEST_DIR;

  console.log('Running sync...');
  try {
    await sync();

    console.log('Sync completed.');

    // Verify schema.json
    const schemaJsonPath = path.join(ALLIUM_DIR, 'schema.json');
    if (fs.existsSync(schemaJsonPath)) {
      const schema = JSON.parse(fs.readFileSync(schemaJsonPath, 'utf-8'));
      console.log('Generated schema.json models:', schema.models.length);
      if (schema.models.some((m) => m.name === 'TestUser')) {
        console.log('SUCCESS: TestUser found in schema.json');
      } else {
        console.error('FAILURE: TestUser not found in schema.json');
        process.exit(1);
      }
    } else {
      console.error('FAILURE: schema.json not generated');
      process.exit(1);
    }

    // Verify schema.prisma
    const prismaPath = path.join(ALLIUM_DIR, 'prisma', 'schema.prisma');
    if (fs.existsSync(prismaPath)) {
      const prismaContent = fs.readFileSync(prismaPath, 'utf-8');
      console.log('Generated schema.prisma size:', prismaContent.length);
      if (prismaContent.includes('model TestUser')) {
        console.log('SUCCESS: TestUser found in schema.prisma');
      } else {
        console.error('FAILURE: TestUser not found in schema.prisma');
        process.exit(1);
      }
    } else {
      console.error('FAILURE: schema.prisma not generated');
      process.exit(1);
    }
  } catch (error) {
    console.error('Sync failed:', error);
    process.exit(1);
  } finally {
    process.cwd = originalCwd;
    // fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
}

runTest();

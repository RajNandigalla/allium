import Ajv from 'ajv';
import fs from 'fs';
import path from 'path';

const schemaPath = path.join(
  __dirname,
  'packages/core/src/schemas/model.schema.json'
);
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf-8'));

const ajv = new Ajv();
const validate = ajv.compile(schema);

const testModel = {
  name: 'TestModel',
  softDelete: true,
  auditTrail: true,
  fields: [
    { name: 'email', type: 'String', writePrivate: true, encrypted: true },
    { name: 'secret', type: 'String', masked: 'customMask' },
    {
      name: 'virtualField',
      type: 'String',
      virtual: true,
      computed: { transform: 'myFunc' },
    },
  ],
  constraints: {
    unique: [['email', 'secret']],
  },
  api: {
    rateLimit: { max: 100, timeWindow: '1m' },
  },
};

const valid = validate(testModel);

if (valid) {
  console.log('Schema validation passed!');
} else {
  console.error('Schema validation failed:', validate.errors);
  process.exit(1);
}

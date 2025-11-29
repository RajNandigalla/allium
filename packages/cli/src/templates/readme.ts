import fs from 'fs';
import path from 'path';
import { translate } from '@allium/core';

interface ReadmeOptions {
  projectName: string;
  database: string;
  hasModels?: boolean;
}

// Database-specific configuration
const databaseConfig: Record<string, { name: string; url: string }> = {
  sqlite: {
    name: 'SQLite',
    url: 'file:./dev.db',
  },
  postgresql: {
    name: 'PostgreSQL',
    url: 'postgresql://user:password@localhost:5432/mydb',
  },
  mysql: {
    name: 'MySQL',
    url: 'mysql://user:password@localhost:3306/mydb',
  },
  mongodb: {
    name: 'MongoDB',
    url: 'mongodb://localhost:27017/mydb',
  },
};

export function generateReadme(options: ReadmeOptions): string {
  const { projectName, database } = options;

  // Read the template file
  const templatePath = path.join(__dirname, 'README.template.md');
  const template = fs.readFileSync(templatePath, 'utf-8');

  // Get database configuration
  const dbConfig = databaseConfig[database] || databaseConfig.sqlite;

  // Apply translations
  return translate(template, {
    projectName,
    databaseName: dbConfig.name,
    databaseUrl: dbConfig.url,
  });
}

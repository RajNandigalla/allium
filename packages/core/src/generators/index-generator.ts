import { ModelDefinition, OverrideInfo } from '../types/model';

/**
 * Generates the index.ts file that exports the correct implementation
 * (either generated or user override)
 */
export function generateModuleIndex(
  model: ModelDefinition,
  overrides: OverrideInfo
): string {
  const modelLower = model.name.toLowerCase();
  const relativePath = `../../../.allium/generated/modules/${modelLower}`;

  let content = `// Auto-generated index - DO NOT EDIT\n`;
  content += `// This file exports the correct implementation based on overrides\n\n`;

  // Service export
  if (overrides.service) {
    content += `// Using user override\n`;
    content += `export * from './overrides/${modelLower}.service';\n`;
  } else {
    content += `// Using generated service\n`;
    content += `export * from '${relativePath}/${modelLower}.service';\n`;
  }

  content += `\n`;

  // Controller export
  if (overrides.controller) {
    content += `// Using user override\n`;
    content += `export * from './overrides/${modelLower}.controller';\n`;
  } else {
    content += `// Using generated controller\n`;
    content += `export * from '${relativePath}/${modelLower}.controller';\n`;
  }

  content += `\n`;

  // Routes export
  if (overrides.routes) {
    content += `// Using user override\n`;
    content += `export * from './overrides/${modelLower}.routes';\n`;
  } else {
    content += `// Using generated routes\n`;
    content += `export * from '${relativePath}/${modelLower}.routes';\n`;
  }

  content += `\n`;

  // Schema and resolver always use generated (no override support yet)
  content += `// Schema and resolvers (always generated)\n`;
  content += `export * from '${relativePath}/${modelLower}.schema';\n`;
  content += `export * from '${relativePath}/${modelLower}.resolver';\n`;

  return content;
}

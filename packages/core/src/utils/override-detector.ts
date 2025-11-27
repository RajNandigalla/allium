import fs from 'fs-extra';
import path from 'path';
import { OverrideInfo } from '../types/model';

/**
 * Detects if user has created override files for a model
 */
export function detectOverrides(
  projectRoot: string,
  modelName: string
): OverrideInfo {
  const modelLower = modelName.toLowerCase();
  const overridePath = path.join(
    projectRoot,
    'src',
    'modules',
    modelLower,
    'overrides'
  );

  if (!fs.existsSync(overridePath)) {
    return {};
  }

  const overrides: OverrideInfo = {};

  // Check for service override
  const servicePath = path.join(overridePath, `${modelLower}.service.ts`);
  if (fs.existsSync(servicePath)) {
    overrides.service = true;
  }

  // Check for controller override
  const controllerPath = path.join(overridePath, `${modelLower}.controller.ts`);
  if (fs.existsSync(controllerPath)) {
    overrides.controller = true;
  }

  // Check for routes override
  const routesPath = path.join(overridePath, `${modelLower}.routes.ts`);
  if (fs.existsSync(routesPath)) {
    overrides.routes = true;
  }

  // Find custom method files
  const customMethods: string[] = [];
  const files = fs.readdirSync(overridePath);

  for (const file of files) {
    if (
      file.endsWith('.ts') &&
      !file.includes('.service.') &&
      !file.includes('.controller.') &&
      !file.includes('.routes.')
    ) {
      customMethods.push(path.basename(file, '.ts'));
    }
  }

  if (customMethods.length > 0) {
    overrides.customMethods = customMethods;
  }

  return overrides;
}

/**
 * Gets the path where generated files should be stored
 */
export function getGeneratedPath(
  projectRoot: string,
  modelName: string
): string {
  return path.join(
    projectRoot,
    '.allium',
    'generated',
    'modules',
    modelName.toLowerCase()
  );
}

/**
 * Gets the path where user overrides are stored
 */
export function getOverridePath(
  projectRoot: string,
  modelName: string
): string {
  return path.join(
    projectRoot,
    'src',
    'modules',
    modelName.toLowerCase(),
    'overrides'
  );
}

/**
 * Gets the path for the module index file
 */
export function getModuleIndexPath(
  projectRoot: string,
  modelName: string
): string {
  return path.join(
    projectRoot,
    'src',
    'modules',
    modelName.toLowerCase(),
    'index.ts'
  );
}

// Main Allium plugin export (recommended usage)
export { default as alliumPlugin } from './plugins/allium';
export type { AlliumPluginOptions } from './plugins/allium';

// Modular plugins
export { default as modelSchemasPlugin } from './framework/model-schemas';
export type { ModelSchemasPluginOptions } from './framework/model-schemas';

export { default as modelRoutesPlugin } from './framework/model-routes';
export type { ModelRoutesPluginOptions } from './framework/model-routes';

// Convenience function for quick setup
export { initAllium } from './server';
export type { AlliumServerConfig } from './server';

// Re-export app for compatibility
export { default as app } from './app';

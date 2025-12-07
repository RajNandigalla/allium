import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { getModelDirectoryPath } from './config';

export interface RouteConfig {
  path?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  middleware?: string[];
  rateLimit?: {
    max: number;
    timeWindow: string;
  };
  auth?: boolean | string[];
  customHandler?: string;
  [key: string]: any;
}

export interface ServiceConfig {
  methods?: {
    [methodName: string]: {
      enabled?: boolean;
      pagination?: boolean;
      softDelete?: boolean;
    };
  };
  hooks?: {
    beforeCreate?: string;
    afterCreate?: string;
    beforeUpdate?: string;
    afterUpdate?: string;
    beforeDelete?: string;
    afterDelete?: string;
  };
  customMethods?: Array<{
    name: string;
    description?: string;
  }>;
  [key: string]: any;
}

export interface ControllerConfig {
  validation?: {
    create?: Record<string, string>;
    update?: Record<string, string>;
  };
  transform?: {
    input?: string;
    output?: string;
  };
  errorHandling?: {
    custom?: boolean;
    handler?: string;
  };
  [key: string]: any;
}

export interface OverrideInfo {
  service?: boolean;
  controller?: boolean;
  routes?: boolean;
  customMethods?: string[];
}

export interface ModelDefinition {
  name: string;
  softDelete?: boolean;
  auditTrail?: boolean;
  api?: {
    prefix?: string;
    version?: string;
    public?: boolean;
    operations?: string[];
    rateLimit?: {
      max?: number;
      timeWindow?: string;
    };
    [key: string]: any;
  };
  routes?: Record<string, RouteConfig>;
  service?: ServiceConfig;
  controller?: ControllerConfig;
  hasOverrides?: OverrideInfo;
  constraints?: {
    unique?: string[][];
    indexes?: string[][];
    [key: string]: any;
  };
  fields?: Array<{
    name: string;
    type: string;
    required?: boolean;
    unique?: boolean;
    default?: any;
    values?: string[];
    private?: boolean;
    writePrivate?: boolean;
    encrypted?: boolean;
    virtual?: boolean;
    computed?: any;
    masked?: any;
    validation?: any;
    jsonSchema?: any;
    [key: string]: any;
  }>;
  relations?: Array<{
    name: string;
    model?: string;
    models?: string[];
    type: string;
    [key: string]: any;
  }>;
  [key: string]: any;
}

/**
 * Model loader and cache manager
 */
export class ModelLoader {
  private models: Map<string, ModelDefinition> = new Map();
  private fileWatcher: vscode.FileSystemWatcher | undefined;

  constructor() {
    this.loadModels();
    this.setupWatcher();
  }

  /**
   * Load all models from the workspace
   */
  private async loadModels(): Promise<void> {
    const modelDir = getModelDirectoryPath();
    if (!modelDir || !fs.existsSync(modelDir)) {
      return;
    }

    const files = fs.readdirSync(modelDir);
    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(modelDir, file);
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          const model: ModelDefinition = JSON.parse(content);
          this.models.set(model.name, model);
        } catch (error) {
          console.error(`Error loading model ${file}:`, error);
        }
      }
    }
  }

  /**
   * Set up file watcher for model changes
   */
  private setupWatcher(): void {
    const modelDir = getModelDirectoryPath();
    if (!modelDir) {
      return;
    }

    const pattern = new vscode.RelativePattern(modelDir, '*.json');
    this.fileWatcher = vscode.workspace.createFileSystemWatcher(pattern);

    this.fileWatcher.onDidCreate(() => this.loadModels());
    this.fileWatcher.onDidChange(() => this.loadModels());
    this.fileWatcher.onDidDelete(() => this.loadModels());
  }

  /**
   * Get a model by name
   */
  getModel(name: string): ModelDefinition | undefined {
    return this.models.get(name);
  }

  /**
   * Get all model names
   */
  getAllModelNames(): string[] {
    return Array.from(this.models.keys());
  }

  /**
   * Get all models
   */
  getAllModels(): ModelDefinition[] {
    return Array.from(this.models.values());
  }

  /**
   * Check if a model exists
   */
  modelExists(name: string): boolean {
    return this.models.has(name);
  }

  /**
   * Dispose the file watcher
   */
  dispose(): void {
    this.fileWatcher?.dispose();
  }
}

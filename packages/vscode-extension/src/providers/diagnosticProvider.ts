import * as vscode from 'vscode';
import { ModelLoader, ModelDefinition } from '../utils/modelLoader';

export class AlliumDiagnosticProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private readonly validTypes = new Set([
    'String',
    'Int',
    'Float',
    'Boolean',
    'DateTime',
    'Json',
    'Enum',
  ]);

  constructor(private modelLoader: ModelLoader) {
    this.diagnosticCollection =
      vscode.languages.createDiagnosticCollection('allium');
  }

  async validateDocument(document: vscode.TextDocument): Promise<void> {
    if (document.languageId !== 'json') {
      return;
    }

    const diagnostics: vscode.Diagnostic[] = [];

    try {
      const text = document.getText();
      const model: ModelDefinition = JSON.parse(text);

      // 1. Validate Top-Level Model Structure
      const allowedModelKeys = [
        'name',
        'fields',
        'relations',
        'softDelete',
        'auditTrail',
        'api',
        'constraints',
        'routes',
        'service',
        'controller',
        'hasOverrides',
      ];
      Object.keys(model).forEach((key) => {
        if (!allowedModelKeys.includes(key)) {
          const range = this.findPropertyRange(document, key, key);
          if (range) {
            diagnostics.push(
              new vscode.Diagnostic(
                range,
                `Property '${key}' is not allowed in model definition. Allowed properties: ${allowedModelKeys.join(
                  ', '
                )}`,
                vscode.DiagnosticSeverity.Error
              )
            );
          }
        }
      });

      // 1.1 Validate Model Name
      if (model.name && !/^[A-Z][a-zA-Z0-9]*$/.test(model.name)) {
        const range = this.findPropertyRange(document, 'name', model.name);
        if (range) {
          diagnostics.push(
            new vscode.Diagnostic(
              range,
              `Model name '${model.name}' must be in PascalCase (e.g. UserProfile)`,
              vscode.DiagnosticSeverity.Error
            )
          );
        }
      }

      // 2. Validate Fields
      if (model.fields) {
        const fieldNames = new Set<string>();
        const allowedFieldKeys = [
          'name',
          'type',
          'required',
          'unique',
          'default',
          'values',
          'private',
          'writePrivate',
          'encrypted',
          'virtual',
          'computed',
          'masked',
          'validation',
          'jsonSchema',
        ];

        for (const field of model.fields) {
          // Strict Field Key Check
          Object.keys(field).forEach((key) => {
            if (!allowedFieldKeys.includes(key)) {
              const range = this.findPropertyRange(document, key, key);
              if (range) {
                diagnostics.push(
                  new vscode.Diagnostic(
                    range,
                    `Property '${key}' is not allowed in field definition.`,
                    vscode.DiagnosticSeverity.Error
                  )
                );
              }
            }
          });

          // Check Duplicate Field Names
          if (fieldNames.has(field.name)) {
            const range = this.findPropertyRange(
              document,
              field.name,
              field.name
            );
            if (range) {
              diagnostics.push(
                new vscode.Diagnostic(
                  range,
                  `Duplicate field name '${field.name}'`,
                  vscode.DiagnosticSeverity.Error
                )
              );
            }
          }
          fieldNames.add(field.name);

          // Check Field Name Format (camelCase)
          if (!/^[a-z][a-zA-Z0-9]*$/.test(field.name)) {
            const range = this.findPropertyRange(
              document,
              field.name,
              field.name
            );
            if (range) {
              diagnostics.push(
                new vscode.Diagnostic(
                  range,
                  `Field name '${field.name}' must be in camelCase`,
                  vscode.DiagnosticSeverity.Error
                )
              );
            }
          }

          // Check Valid Type
          if (!this.validTypes.has(field.type)) {
            const range = this.findPropertyRange(
              document,
              field.type,
              field.type
            );
            if (range) {
              // Determine if it was a close match or just wrong
              const diagnostic = new vscode.Diagnostic(
                range,
                `Invalid type '${field.type}'. Must be one of: ${Array.from(
                  this.validTypes
                ).join(', ')}`,
                vscode.DiagnosticSeverity.Error
              );
              diagnostics.push(diagnostic);
            }
          }

          // Check 'required' property type
          if (
            'required' in field &&
            typeof (field as any).required !== 'boolean'
          ) {
            const val = (field as any).required;
            const range = this.findPropertyRange(
              document,
              'required',
              String(val)
            );
            if (range) {
              diagnostics.push(
                new vscode.Diagnostic(
                  range,
                  `Property 'required' must be a boolean (true/false), found ${typeof val}`,
                  vscode.DiagnosticSeverity.Error
                )
              );
            }
          }

          // Check 'unique' property type
          if ('unique' in field && typeof (field as any).unique !== 'boolean') {
            const val = (field as any).unique;
            const range = this.findPropertyRange(
              document,
              'unique',
              String(val)
            );
            if (range) {
              diagnostics.push(
                new vscode.Diagnostic(
                  range,
                  `Property 'unique' must be a boolean (true/false), found ${typeof val}`,
                  vscode.DiagnosticSeverity.Error
                )
              );
            }
          }

          // Check Enum Values
          if (
            field.type === 'Enum' &&
            (!('values' in field) || !Array.isArray((field as any).values))
          ) {
            const range = this.findPropertyRange(
              document,
              field.name,
              field.name
            );
            if (range) {
              diagnostics.push(
                new vscode.Diagnostic(
                  range,
                  `Enum field '${field.name}' must have a 'values' array`,
                  vscode.DiagnosticSeverity.Error
                )
              );
            }
          }

          // Check Masked Object Structure
          if ('masked' in field && typeof (field as any).masked === 'object') {
            const masked = (field as any).masked;
            const allowedKeys = ['pattern', 'visibleStart', 'visibleEnd'];
            Object.keys(masked).forEach((key) => {
              if (!allowedKeys.includes(key)) {
                const range = this.findPropertyRange(document, key, key);
                if (range) {
                  diagnostics.push(
                    new vscode.Diagnostic(
                      range,
                      `Property '${key}' is not allowed in 'masked' configuration. Allowed properties: ${allowedKeys.join(
                        ', '
                      )}`,
                      vscode.DiagnosticSeverity.Error
                    )
                  );
                }
              }
            });
          }

          // Check Validation Object Structure
          if (
            'validation' in field &&
            typeof (field as any).validation === 'object'
          ) {
            const validation = (field as any).validation;
            const allowedKeys = ['min', 'max', 'regex', 'message', 'custom'];
            Object.keys(validation).forEach((key) => {
              if (!allowedKeys.includes(key)) {
                const range = this.findPropertyRange(document, key, key);
                if (range) {
                  diagnostics.push(
                    new vscode.Diagnostic(
                      range,
                      `Property '${key}' is not allowed in 'validation' configuration. Allowed properties: ${allowedKeys.join(
                        ', '
                      )}`,
                      vscode.DiagnosticSeverity.Error
                    )
                  );
                }
              }
            });
          }
        }
      }

      // 3. Validate Relations
      if (model.relations) {
        const relationNames = new Set<string>();
        const allowedRelationKeys = ['name', 'type', 'model', 'models'];

        for (const relation of model.relations) {
          // Strict Relation Key Check
          Object.keys(relation).forEach((key) => {
            if (!allowedRelationKeys.includes(key)) {
              const range = this.findPropertyRange(document, key, key);
              if (range) {
                diagnostics.push(
                  new vscode.Diagnostic(
                    range,
                    `Property '${key}' is not allowed in relation definition.`,
                    vscode.DiagnosticSeverity.Error
                  )
                );
              }
            }
          });

          // Duplicate check
          if (relationNames.has(relation.name)) {
            const range = this.findPropertyRange(
              document,
              relation.name,
              relation.name
            );
            if (range) {
              diagnostics.push(
                new vscode.Diagnostic(
                  range,
                  `Duplicate relation name '${relation.name}'`,
                  vscode.DiagnosticSeverity.Error
                )
              );
            }
          }
          relationNames.add(relation.name);

          // Check Reference Model Existence
          if (relation.model && !this.modelLoader.modelExists(relation.model)) {
            const range = this.findPropertyRange(
              document,
              relation.model,
              relation.model
            );
            if (range) {
              diagnostics.push(
                new vscode.Diagnostic(
                  range,
                  `Referenced model '${relation.model}' does not exist`,
                  vscode.DiagnosticSeverity.Error
                )
              );
            }
          }
        }
      }

      // 4. Validate API Configuration
      if (model.api) {
        const allowedApiKeys = [
          'prefix',
          'version',
          'public',
          'operations',
          'rateLimit',
        ];
        Object.keys(model.api).forEach((key) => {
          if (!allowedApiKeys.includes(key)) {
            const range = this.findPropertyRange(document, key, key);
            if (range) {
              diagnostics.push(
                new vscode.Diagnostic(
                  range,
                  `Property '${key}' is not allowed in 'api' configuration.`,
                  vscode.DiagnosticSeverity.Error
                )
              );
            }
          }
        });
      }

      // 5. Validate Routes
      if (model.routes) {
        const allowedRouteKeys = [
          'path',
          'method',
          'middleware',
          'rateLimit',
          'auth',
          'customHandler',
        ];
        Object.keys(model.routes).forEach((routeName) => {
          const routeConfig = model.routes![routeName];
          if (typeof routeConfig === 'object') {
            Object.keys(routeConfig).forEach((key) => {
              if (!allowedRouteKeys.includes(key)) {
                const range = this.findPropertyRange(document, key, key);
                if (range) {
                  diagnostics.push(
                    new vscode.Diagnostic(
                      range,
                      `Property '${key}' is not allowed in route configuration.`,
                      vscode.DiagnosticSeverity.Error
                    )
                  );
                }
              }
            });
          }
        });
      }

      // 6. Validate Service Configuration
      if (model.service) {
        const allowedServiceKeys = ['methods', 'hooks', 'customMethods'];
        Object.keys(model.service).forEach((key) => {
          if (!allowedServiceKeys.includes(key)) {
            const range = this.findPropertyRange(document, key, key);
            if (range) {
              diagnostics.push(
                new vscode.Diagnostic(
                  range,
                  `Property '${key}' is not allowed in 'service' configuration.`,
                  vscode.DiagnosticSeverity.Error
                )
              );
            }
          }
        });
      }

      // 7. Validate Controller Configuration
      if (model.controller) {
        const allowedControllerKeys = [
          'validation',
          'transform',
          'errorHandling',
        ];
        Object.keys(model.controller).forEach((key) => {
          if (!allowedControllerKeys.includes(key)) {
            const range = this.findPropertyRange(document, key, key);
            if (range) {
              diagnostics.push(
                new vscode.Diagnostic(
                  range,
                  `Property '${key}' is not allowed in 'controller' configuration.`,
                  vscode.DiagnosticSeverity.Error
                )
              );
            }
          }
        });
      }

      // 8. Validate Overrides
      if (model.hasOverrides) {
        const allowedOverrideKeys = [
          'service',
          'controller',
          'routes',
          'customMethods',
        ];
        Object.keys(model.hasOverrides).forEach((key) => {
          if (!allowedOverrideKeys.includes(key)) {
            const range = this.findPropertyRange(document, key, key);
            if (range) {
              diagnostics.push(
                new vscode.Diagnostic(
                  range,
                  `Property '${key}' is not allowed in 'hasOverrides'.`,
                  vscode.DiagnosticSeverity.Error
                )
              );
            }
          }
        });
      }
    } catch (error) {
      // JSON syntax errors handled natively by VS Code
    }

    this.diagnosticCollection.set(document.uri, diagnostics);
  }

  private findPropertyRange(
    document: vscode.TextDocument,
    property: string,
    value: string
  ): vscode.Range | undefined {
    const text = document.getText();
    // Simple search strategy - looking for the value string
    // In a production specific parser, json-to-ast would be better
    let index = text.indexOf(`"${value}"`);

    if (index === -1) {
      // Fallback for non-quoted values (unlikely for strings) or property keys
      index = text.indexOf(value);
    }

    if (index !== -1) {
      return new vscode.Range(
        document.positionAt(index),
        document.positionAt(index + value.length)
      );
    }
    return undefined;
  }

  clearDiagnostics(document: vscode.TextDocument): void {
    this.diagnosticCollection.delete(document.uri);
  }

  dispose(): void {
    this.diagnosticCollection.dispose();
  }
}

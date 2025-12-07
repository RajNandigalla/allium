import * as vscode from 'vscode';
import { ModelLoader } from '../utils/modelLoader';

export class AlliumCompletionProvider implements vscode.CompletionItemProvider {
  constructor(private modelLoader: ModelLoader) {}

  provideCompletionItems(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.CompletionItem[] | undefined {
    const linePrefix = document
      .lineAt(position)
      .text.substr(0, position.character);
    const text = document.getText();
    const offset = document.offsetAt(position);
    const beforeCursor = text.substring(0, offset);

    // Determine the context by detecting the enclosing JSON key
    const enclosingKey = this.getEnclosingKey(beforeCursor);

    // 1. Value Completions
    if (this.isValueCompletion(linePrefix)) {
      const propertyName = this.getPropertyName(linePrefix);

      if (propertyName === 'type') {
        if (enclosingKey === 'fields') {
          return this.getFieldTypeCompletions();
        }
        if (enclosingKey === 'relations') {
          return this.getRelationTypeCompletions();
        }
      }

      if (propertyName === 'model' && enclosingKey === 'relations') {
        return this.getModelNameCompletions();
      }

      if (
        [
          'required',
          'unique',
          'softDelete',
          'auditTrail',
          'private',
          'writePrivate',
          'encrypted',
          'virtual',
          'public',
        ].includes(propertyName || '')
      ) {
        return this.getBooleanCompletions();
      }
    }

    // 2. Property Key Completions
    if (this.isPropertyCompletion(linePrefix)) {
      const replacementRange = this.calculateReplacementRange(
        document,
        position
      );

      if (enclosingKey === 'fields') {
        return this.getFieldPropertyCompletions(replacementRange);
      }
      if (enclosingKey === 'relations') {
        return this.getRelationPropertyCompletions(replacementRange);
      }
      if (enclosingKey === 'api') {
        return this.getApiPropertyCompletions(replacementRange);
      }
      // 4. Nested Object Property Completions
      // The enclosingKey is already determined at the top of the method.
      // API RateLimit
      if (enclosingKey === 'rateLimit') {
        return this.getRateLimitPropertyCompletions(replacementRange);
      }

      // Service Config
      if (enclosingKey === 'service') {
        // Assuming getServicePropertyCompletions exists or will be added
        // return this.getServicePropertyCompletions(replacementRange);
      }

      // Controller Config
      if (enclosingKey === 'controller') {
        // Assuming getControllerPropertyCompletions exists or will be added
        // return this.getControllerPropertyCompletions(replacementRange);
      }

      // Routes (Logic to detect if we are inside a specific route definition or just "routes" object)
      // For simplicity, if enclosing is a route path (custom string), we show route props
      // We can check if grandparent is "routes"
      if (enclosingKey === 'routes') {
        // If directly in routes, we might expect route names (keys), but if inside a route object...
        // This simple check might be inside the 'routes' object but not inside a route definition
        // We'll leave this for now or enhance getEnclosingKey to return stack
      }
      if (enclosingKey === 'computed') {
        return this.getComputedPropertyCompletions(replacementRange);
      }
      if (enclosingKey === 'constraints') {
        return this.getConstraintsPropertyCompletions(replacementRange);
      }
      if (enclosingKey === 'validation') {
        return this.getValidationPropertyCompletions(replacementRange);
      }
      if (enclosingKey === 'masked') {
        return this.getMaskedPropertyCompletions(replacementRange);
      }
      if (!enclosingKey) {
        return this.getModelPropertyCompletions(replacementRange);
      }
    }

    return undefined;
  }

  private calculateReplacementRange(
    document: vscode.TextDocument,
    position: vscode.Position
  ): vscode.Range {
    const range = document.getWordRangeAtPosition(position);
    let start = range ? range.start : position;
    let end = range ? range.end : position;

    // Check for quote before
    if (start.character > 0) {
      const prevCharRange = new vscode.Range(start.translate(0, -1), start);
      if (document.getText(prevCharRange) === '"') {
        start = start.translate(0, -1);
      }
    }

    // Check for quote after
    // Note: position might be in the middle of a word, 'end' is usually the end of the word
    const nextCharRange = new vscode.Range(end, end.translate(0, 1));
    if (document.getText(nextCharRange) === '"') {
      end = end.translate(0, 1);
    }

    return new vscode.Range(start, end);
  }

  // Helper to scan backwards and find the key of the enclosing object/array
  private getEnclosingKey(text: string): string | undefined {
    let braceBalance = 0;

    for (let i = text.length - 1; i >= 0; i--) {
      const char = text[i];
      if (char === '}') {
        braceBalance++;
      } else if (char === '{') {
        braceBalance--;
        if (braceBalance < 0) {
          // We found an opening brace '{' that we are inside.
          // Check if there is a key before it: "key": {
          const prefix = text.substring(0, i).trim();
          if (prefix.endsWith(':')) {
            const match = prefix.match(/"(\w+)"\s*:\s*$/);
            if (match) return match[1];
          }
          // If no key, it might be an object in an array. continue scanning.
        }
      } else if (char === ']') {
        braceBalance++;
      } else if (char === '[') {
        braceBalance--;
        // If braceBalance < 0, it means we are inside this array '[ ... ]'
        if (braceBalance < 0) {
          const prefix = text.substring(0, i).trim();
          if (prefix.endsWith(':')) {
            const match = prefix.match(/"(\w+)"\s*:\s*$/);
            if (match) return match[1];
          }
        }
      }
    }
    return undefined;
  }

  private isValueCompletion(linePrefix: string): boolean {
    return (
      /"\w+"\s*:\s*"?$/.test(linePrefix) ||
      /"\w+"\s*:\s*[^",}]*$/.test(linePrefix)
    );
  }

  private getPropertyName(linePrefix: string): string | undefined {
    const match = linePrefix.match(/"(\w+)"\s*:/);
    return match ? match[1] : undefined;
  }

  private isPropertyCompletion(linePrefix: string): boolean {
    // Remove the current word/string being typed to see what comes before it
    const prefixWithoutCurrentWord = linePrefix.replace(
      /\s*("?[\w]*"?)\s*$/,
      ''
    );
    const trimmedPrefix = prefixWithoutCurrentWord.trim();

    // valid property start if formatting is clean or follows comma/brace
    return (
      trimmedPrefix === '' ||
      trimmedPrefix.endsWith('{') ||
      trimmedPrefix.endsWith(',')
    );
  }

  private getBooleanCompletions(): vscode.CompletionItem[] {
    return [
      new vscode.CompletionItem('true', vscode.CompletionItemKind.Keyword),
      new vscode.CompletionItem('false', vscode.CompletionItemKind.Keyword),
    ];
  }

  private getFieldTypeCompletions(): vscode.CompletionItem[] {
    const types = [
      { label: 'String', detail: 'Text' },
      { label: 'Int', detail: 'Integer' },
      { label: 'Float', detail: 'Decimal' },
      { label: 'Boolean', detail: 'True/False' },
      { label: 'DateTime', detail: 'Date Time' },
      { label: 'Json', detail: 'JSON Structure' },
      { label: 'Enum', detail: 'Enumeration' },
    ];
    return this.mapToEnum(types);
  }

  private getRelationTypeCompletions(): vscode.CompletionItem[] {
    const types = [
      { label: '1:1', detail: 'One-to-One' },
      { label: '1:n', detail: 'One-to-Many' },
      { label: 'n:m', detail: 'Many-to-Many' },
      { label: 'polymorphic', detail: 'Polymorphic' },
    ];
    return this.mapToEnum(types);
  }

  private mapToEnum(types: any[]): vscode.CompletionItem[] {
    return types.map((t) => {
      const item = new vscode.CompletionItem(
        t.label,
        vscode.CompletionItemKind.EnumMember
      );
      item.detail = t.detail;
      return item;
    });
  }

  private getModelNameCompletions(): vscode.CompletionItem[] {
    return this.modelLoader
      .getAllModelNames()
      .map(
        (name) =>
          new vscode.CompletionItem(name, vscode.CompletionItemKind.Class)
      );
  }

  private getFieldPropertyCompletions(
    range: vscode.Range
  ): vscode.CompletionItem[] {
    const fieldProps = [
      { label: 'name', insertText: '"name": "$1"', detail: 'Field Name' },
      {
        label: 'type',
        insertText:
          '"type": "${1|String,Int,Float,Boolean,DateTime,Json,Enum|}"',
        detail: 'Field Type',
      },
      {
        label: 'required',
        insertText: '"required": ${1|true,false|}',
        detail: 'Mandatory',
      },
      {
        label: 'unique',
        insertText: '"unique": ${1|true,false|}',
        detail: 'Unique Constraint',
      },
      {
        label: 'default',
        insertText: '"default": "$1"',
        detail: 'Default Value',
      },
      {
        label: 'values',
        insertText: '"values": ["$1"]',
        detail: 'Enum Values',
      },
      // Advanced fields
      {
        label: 'private',
        insertText: '"private": ${1|true,false|}',
        detail: 'Exclude from API',
      },
      {
        label: 'writePrivate',
        insertText: '"writePrivate": ${1|true,false|}',
        detail: 'ReadOnly for Users',
      },
      {
        label: 'encrypted',
        insertText: '"encrypted": ${1|true,false|}',
        detail: 'Encrypted in DB',
      },
      {
        label: 'virtual',
        insertText: '"virtual": ${1|true,false|}',
        detail: 'Virtual Field',
      },
      {
        label: 'computed',
        insertText: '"computed": {\n\t"template": "$1"\n}',
        detail: 'Computed Field Config',
      },
      {
        label: 'masked',
        insertText: '"masked": {\n\t"pattern": "$1"\n}',
        detail: 'Masking Config',
      },
      {
        label: 'validation',
        insertText: '"validation": {\n\t$1\n}',
        detail: 'Validation Rules',
      },
      {
        label: 'jsonSchema',
        insertText: '"jsonSchema": {\n\t$1\n}',
        detail: 'JSON Schema Definition',
      },
    ];
    return this.mapToCompletions(fieldProps, range);
  }

  private getRelationPropertyCompletions(
    range: vscode.Range
  ): vscode.CompletionItem[] {
    const relationProps = [
      { label: 'name', insertText: '"name": "$1"', detail: 'Relation Name' },
      {
        label: 'type',
        insertText: '"type": "${1|1:1,1:n,n:m,polymorphic|}"',
        detail: 'Relation Type',
      },
      { label: 'model', insertText: '"model": "$1"', detail: 'Target Model' },
      {
        label: 'models',
        insertText: '"models": ["$1"]',
        detail: 'Polymorphic Models',
      },
    ];
    return this.mapToCompletions(relationProps, range);
  }

  private getApiPropertyCompletions(
    range: vscode.Range
  ): vscode.CompletionItem[] {
    const props = [
      {
        label: 'prefix',
        insertText: '"prefix": "$1"',
        detail: 'API Endpoint Prefix',
      },
      {
        label: 'public',
        insertText: '"public": ${1|true,false|}',
        detail: 'Is Public API',
      },
      {
        label: 'operations',
        insertText: '"operations": ["${1|create,read,update,delete,list|}"]',
        detail: 'Allowed Operations',
      },
      {
        label: 'rateLimit',
        insertText:
          '"rateLimit": {\n\t"max": ${1:100},\n\t"timeWindow": "${2:1m}"\n}',
        detail: 'API Rate Limiting',
      },
    ];
    return this.mapToCompletions(props, range);
  }

  private getValidationPropertyCompletions(
    range: vscode.Range
  ): vscode.CompletionItem[] {
    const props = [
      { label: 'min', insertText: '"min": $1', detail: 'Minimum Value/Length' },
      { label: 'max', insertText: '"max": $1', detail: 'Maximum Value/Length' },
      { label: 'regex', insertText: '"regex": "$1"', detail: 'Regex Pattern' },
      {
        label: 'message',
        insertText: '"message": "$1"',
        detail: 'Error Message',
      },
      {
        label: 'custom',
        insertText: '"custom": "$1"',
        detail: 'Custom Validation Function',
      },
    ];
    return this.mapToCompletions(props, range);
  }

  private getRateLimitPropertyCompletions(
    range: vscode.Range
  ): vscode.CompletionItem[] {
    const props = [
      { label: 'max', insertText: '"max": $1', detail: 'Max Requests' },
      {
        label: 'timeWindow',
        insertText: '"timeWindow": "$1"',
        detail: 'Time Window (e.g. 1m, 1h)',
      },
    ];
    return this.mapToCompletions(props, range);
  }

  private getComputedPropertyCompletions(
    range: vscode.Range
  ): vscode.CompletionItem[] {
    const props = [
      {
        label: 'template',
        insertText: '"template": "$1"',
        detail: 'Computation Template',
      },
      {
        label: 'transform',
        insertText: '"transform": "$1"',
        detail: 'Transformation Function',
      },
    ];
    return this.mapToCompletions(props, range);
  }

  private getMaskedPropertyCompletions(
    range: vscode.Range
  ): vscode.CompletionItem[] {
    const props = [
      {
        label: 'pattern',
        insertText: '"pattern": "$1"',
        detail: 'Mask Pattern (e.g. *)',
      },
      {
        label: 'visibleStart',
        insertText: '"visibleStart": ${1:0}',
        detail: 'Visible Chars at Start',
      },
      {
        label: 'visibleEnd',
        insertText: '"visibleEnd": ${1:0}',
        detail: 'Visible Chars at End',
      },
    ];
    return this.mapToCompletions(props, range);
  }

  private getConstraintsPropertyCompletions(
    range: vscode.Range
  ): vscode.CompletionItem[] {
    const props = [
      {
        label: 'unique',
        insertText: '"unique": [["$1"]]',
        detail: 'Compound Unique',
      },
      {
        label: 'indexes',
        insertText: '"indexes": [["$1"]]',
        detail: 'Compound Indexes',
      },
    ];
    return this.mapToCompletions(props, range);
  }

  private getModelPropertyCompletions(
    range: vscode.Range
  ): vscode.CompletionItem[] {
    const modelProps = [
      { label: 'name', insertText: '"name": "$1"', detail: 'Model Name' },
      {
        label: 'fields',
        insertText: '"fields": [\n\t$1\n]',
        detail: 'Fields Array',
      },
      {
        label: 'relations',
        insertText: '"relations": [\n\t$1\n]',
        detail: 'Relations Array',
      },
      {
        label: 'softDelete',
        insertText: '"softDelete": ${1|true,false|}',
        detail: 'Soft Delete',
      },
      {
        label: 'auditTrail',
        insertText: '"auditTrail": ${1|true,false|}',
        detail: 'Audit Trail',
      },
      {
        label: 'api',
        insertText: '"api": {\n\t$1\n}',
        detail: 'API Configuration',
      },
      {
        label: 'constraints',
        insertText: '"constraints": {\n\t$1\n}',
        detail: 'DB Constraints',
      },
      {
        label: 'routes',
        insertText: '"routes": {\n\t"$1": {\n\t\t"method": "GET"\n\t}\n}',
        detail: 'Custom Routes',
      },
      {
        label: 'service',
        insertText: '"service": {\n\t"methods": {}\n}',
        detail: 'Service Config',
      },
      {
        label: 'controller',
        insertText: '"controller": {\n\t"validation": {}\n}',
        detail: 'Controller Config',
      },
    ];
    return this.mapToCompletions(modelProps, range);
  }

  private getServicePropertyCompletions(
    range: vscode.Range
  ): vscode.CompletionItem[] {
    const props = [
      {
        label: 'methods',
        insertText: '"methods": {\n\t$1\n}',
        detail: 'Method Config',
      },
      {
        label: 'hooks',
        insertText: '"hooks": {\n\t$1\n}',
        detail: 'Service Hooks',
      },
      {
        label: 'customMethods',
        insertText: '"customMethods": [\n\t$1\n]',
        detail: 'Custom Methods',
      },
    ];
    return this.mapToCompletions(props, range);
  }

  private getControllerPropertyCompletions(
    range: vscode.Range
  ): vscode.CompletionItem[] {
    const props = [
      {
        label: 'validation',
        insertText: '"validation": {\n\t$1\n}',
        detail: 'Request Validation',
      },
      {
        label: 'transform',
        insertText: '"transform": {\n\t$1\n}',
        detail: 'Data Transformation',
      },
      {
        label: 'errorHandling',
        insertText: '"errorHandling": {\n\t$1\n}',
        detail: 'Error Handling',
      },
    ];
    return this.mapToCompletions(props, range);
  }

  private getRoutesPropertyCompletions(
    range: vscode.Range
  ): vscode.CompletionItem[] {
    const props = [
      {
        label: 'method',
        insertText: '"method": "${1|GET,POST,PUT,DELETE,PATCH|}"',
        detail: 'HTTP Method',
      },
      { label: 'path', insertText: '"path": "$1"', detail: 'Route Path' },
      {
        label: 'middleware',
        insertText: '"middleware": ["$1"]',
        detail: 'Middleware',
      },
    ];
    return this.mapToCompletions(props, range);
  }

  private mapToCompletions(
    props: { label: string; insertText: string; detail: string }[],
    range: vscode.Range
  ): vscode.CompletionItem[] {
    return props.map((prop) => {
      const item = new vscode.CompletionItem(
        prop.label,
        vscode.CompletionItemKind.Property
      );
      item.insertText = new vscode.SnippetString(prop.insertText);
      item.range = range;
      item.detail = prop.detail;
      return item;
    });
  }
}

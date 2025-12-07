import * as vscode from 'vscode';
import { ModelLoader } from './utils/modelLoader';
import { isModelFile } from './utils/config';
import { AlliumCompletionProvider } from './providers/completionProvider';
import { AlliumDiagnosticProvider } from './providers/diagnosticProvider';

let modelLoader: ModelLoader;
let diagnosticProvider: AlliumDiagnosticProvider;

export function activate(context: vscode.ExtensionContext) {
  console.log('Allium Model Tools extension is now active!');

  modelLoader = new ModelLoader();
  diagnosticProvider = new AlliumDiagnosticProvider(modelLoader);

  const completionProvider = vscode.languages.registerCompletionItemProvider(
    { language: 'json', pattern: '**/.allium/models/*.json' },
    new AlliumCompletionProvider(modelLoader),
    '"',
    ':'
  );

  const visualizeModelCommand = vscode.commands.registerCommand(
    'allium.visualizeModel',
    () => {
      vscode.window.showInformationMessage('Model visualization coming soon!');
    }
  );

  const visualizeAllModelsCommand = vscode.commands.registerCommand(
    'allium.visualizeAllModels',
    () => {
      vscode.window.showInformationMessage(
        'All models visualization coming soon!'
      );
    }
  );

  vscode.workspace.onDidOpenTextDocument((document) => {
    if (isModelFile(document)) {
      diagnosticProvider.validateDocument(document);
    }
  });

  vscode.workspace.onDidChangeTextDocument((event) => {
    if (isModelFile(event.document)) {
      diagnosticProvider.validateDocument(event.document);
    }
  });

  context.subscriptions.push(
    completionProvider,
    visualizeModelCommand,
    visualizeAllModelsCommand,
    { dispose: () => modelLoader.dispose() },
    { dispose: () => diagnosticProvider.dispose() }
  );
}

export function deactivate() {
  if (modelLoader) {
    modelLoader.dispose();
  }
  if (diagnosticProvider) {
    diagnosticProvider.dispose();
  }
}

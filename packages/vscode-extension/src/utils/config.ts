import * as vscode from 'vscode';

/**
 * Get the configured model directory path
 */
export function getModelDirectory(): string {
  const config = vscode.workspace.getConfiguration('allium');
  return config.get<string>('modelDirectory', '.allium/models');
}

/**
 * Get the absolute path to the model directory
 */
export function getModelDirectoryPath(): string | undefined {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  if (!workspaceFolder) {
    return undefined;
  }

  const modelDir = getModelDirectory();
  return vscode.Uri.joinPath(workspaceFolder.uri, modelDir).fsPath;
}

/**
 * Check if a file is an Allium model file
 */
export function isModelFile(document: vscode.TextDocument): boolean {
  if (document.languageId !== 'json') {
    return false;
  }

  const modelDir = getModelDirectory();
  const relativePath = vscode.workspace.asRelativePath(document.uri);

  return relativePath.includes(modelDir) && relativePath.endsWith('.json');
}

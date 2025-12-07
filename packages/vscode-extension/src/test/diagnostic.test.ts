import * as assert from 'assert';
import * as vscode from 'vscode';

suite('Diagnostic Provider Test Suite', () => {
  vscode.window.showInformationMessage('Start Diagnostic Tests.');

  // Helper to wait for extension activation
  const waitForExtension = async () => {
    const ext = vscode.extensions.getExtension(
      'allium-framework.allium-vscode'
    );
    if (ext && !ext.isActive) {
      await ext.activate();
    }
  };

  test('Strict Property Validation - Root Level', async () => {
    await waitForExtension();
    // defined ok: 1 which should be invalid
    const content = '{\n  "name": "User",\n  "ok": 1,\n  "fields": []\n}';
    const doc = await vscode.workspace.openTextDocument({
      language: 'json',
      content,
    });
    // Wait for diagnostics to update (async)
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const diagnostics = vscode.languages.getDiagnostics(doc.uri);
    const error = diagnostics.find((d) =>
      d.message.includes("Property 'ok' is not allowed")
    );

    assert.ok(error, 'Should flag "ok" as unknown property at root');
    assert.strictEqual(error?.severity, vscode.DiagnosticSeverity.Error);
  });

  test('Strict Property Validation - Nested API', async () => {
    const content =
      '{\n  "name": "User",\n  "fields": [],\n  "api": {\n    "invalidProp": true\n  }\n}';
    const doc = await vscode.workspace.openTextDocument({
      language: 'json',
      content,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const diagnostics = vscode.languages.getDiagnostics(doc.uri);
    const error = diagnostics.find((d) =>
      d.message.includes("Property 'invalidProp' is not allowed")
    );

    assert.ok(error, 'Should flag "invalidProp" in api object');
  });

  test('Strict Property Validation - Nested Routes', async () => {
    const content =
      '{\n  "name": "User",\n  "fields": [],\n  "routes": {\n    "/login": {\n      "badKey": 1\n    }\n  }\n}';
    const doc = await vscode.workspace.openTextDocument({
      language: 'json',
      content,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const diagnostics = vscode.languages.getDiagnostics(doc.uri);
    const error = diagnostics.find((d) =>
      d.message.includes("Property 'badKey' is not allowed")
    );

    assert.ok(error, 'Should flag "badKey" in route configuration');
  });

  test('Strict Property Validation - Nested Service', async () => {
    const content =
      '{\n  "name": "User",\n  "fields": [],\n  "service": {\n    "unknownConfig": true\n  }\n}';
    const doc = await vscode.workspace.openTextDocument({
      language: 'json',
      content,
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    const diagnostics = vscode.languages.getDiagnostics(doc.uri);
    const error = diagnostics.find((d) =>
      d.message.includes("Property 'unknownConfig' is not allowed")
    );

    assert.ok(error, 'Should flag "unknownConfig" in service configuration');
  });
});

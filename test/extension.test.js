const assert = require("assert");
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

suite("Consolidate Test Suite", function () {
  this.timeout(10000); // Allow more time for VS Code to load

  suiteTeardown(() => {
    vscode.window.showInformationMessage("All tests done!");
  });

  test("Check Extension Activation", async () => {
    const extension = vscode.extensions.getExtension("Vierweb.consolidate");
    assert.ok(extension, "Extension should be present");

    await extension.activate();
    assert.strictEqual(extension.isActive, true, "Extension should be active");
  });

  test("Check Command Registration", async () => {
    const commandList = await vscode.commands.getCommands(true);
    assert.ok(
      commandList.includes("consolidate.consolidateFiles"),
      'Command "consolidate.consolidateFiles" should be registered'
    );
    assert.ok(
      commandList.includes("consolidate.consolidateSelectedFiles"),
      'Command "consolidate.consolidateSelectedFiles" should be registered'
    );
  });

  test("Check Workspace is Loaded", async () => {
    const workspaceFolders = vscode.workspace.workspaceFolders;
    assert.ok(workspaceFolders, "Workspace should be open");

    const workspacePath = workspaceFolders[0].uri.fsPath;
    const testFilePath = path.join(workspacePath, "data/messages/test.txt");

    assert.ok(
      fs.existsSync(testFilePath),
      "Test file should exist in workspace"
    );
  });
});

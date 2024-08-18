const assert = require("assert");
const vscode = require("vscode");

suite("Simple Extension Test Suite", function () {
  suiteTeardown(() => {
    vscode.window.showInformationMessage("All tests done!");
  });

  test("Sample test - Check Extension Activation", async () => {
    const extension = vscode.extensions.getExtension("Vierweb.consolidate");
    assert.ok(extension, "Extension should be present");

    await extension.activate();
    assert.strictEqual(extension.isActive, true, "Extension should be active");
  });

  test("Sample test - Check Command Registration", async () => {
    const commandList = await vscode.commands.getCommands(true);
    assert.ok(
      commandList.includes("consolidate.consolidateFiles"),
      'Command "consolidate.consolidateFiles" should be registered'
    );
  });
});

const assert = require("assert");
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

suite("Consolidate Test Suite", function () {
  this.timeout(10000); // Allow more time for VS Code to load

  let workspacePath;
  let outputPath;
  let selectedOutputPath;

  suiteSetup(async () => {
    // Ensure the workspace is loaded and get the workspace path
    const workspaceFolders = vscode.workspace.workspaceFolders;
    assert.ok(workspaceFolders, "Workspace should be open");

    workspacePath = workspaceFolders[0].uri.fsPath;
    outputPath = path.join(workspacePath, "consolidated_output.txt");
    selectedOutputPath = path.join(
      workspacePath,
      "consolidated_selected_output.txt"
    );

    // Clean up any pre-existing output file
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
    }
    if (fs.existsSync(selectedOutputPath)) {
      fs.unlinkSync(selectedOutputPath);
    }
  });

  suiteTeardown(() => {
    // Clean up the output file after all tests have completed
    if (fs.existsSync(outputPath)) {
      fs.unlinkSync(outputPath);
      console.log(
        `Deleted output test file: ${path.relative(workspacePath, outputPath)}`
      );
    }
    if (fs.existsSync(selectedOutputPath)) {
      fs.unlinkSync(selectedOutputPath);
      console.log(
        `Deleted selected output test file: ${path.relative(
          workspacePath,
          selectedOutputPath
        )}`
      );
    }

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
    const testFilePath = path.join(workspacePath, "data/messages/test.txt");

    assert.ok(
      fs.existsSync(testFilePath),
      "Test file should exist in workspace"
    );
  });

  test("Consolidate All Files - Respects .gitignore and Hidden Files", async () => {
    // Mock the input box to automatically provide the output file name
    const originalShowInputBox = vscode.window.showInputBox;
    vscode.window.showInputBox = async () => "consolidated_output.txt";

    try {
      // Execute the command
      await vscode.commands.executeCommand("consolidate.consolidateFiles");

      // Check if the file was created
      assert.ok(
        fs.existsSync(outputPath),
        "Output file should be created by consolidateFiles command"
      );

      // Make tests for all files?
      // Test for includes "SHOULD NOT BE INCLUDED"?

      // Verify content of the output file
      const content = fs.readFileSync(outputPath, "utf8");
      assert.ok(
        content.includes("public/script.js"),
        "Output should contain test.txt content"
      );
      assert.ok(
        !content.includes("node_modules"),
        "Output should not include files from node_modules"
      );
      assert.ok(
        !content.includes(".hidden"),
        "Output should not include hidden files like .hidden"
      );
    } finally {
      // Restore the original input box
      vscode.window.showInputBox = originalShowInputBox;
    }
  });
  test("Consolidate Selected Files - Respects all selected files", async () => {
    // Prepare URIs for selected files
    const selectedUris = [
      vscode.Uri.file(path.join(workspacePath, "data/")),
      vscode.Uri.file(path.join(workspacePath, "public/script.js")),
      vscode.Uri.file(path.join(workspacePath, "public/.hidden")),
      vscode.Uri.file(path.join(workspacePath, "package-lock.json")),
    ];

    // Mock the input box to automatically provide the output file name
    const originalShowInputBox = vscode.window.showInputBox;
    vscode.window.showInputBox = async () => "consolidated_selected_output.txt";

    try {
      // Execute the command with the selected URIs
      await vscode.commands.executeCommand(
        "consolidate.consolidateSelectedFiles",
        null,
        selectedUris
      );

      // Check if the file was created
      assert.ok(
        fs.existsSync(selectedOutputPath),
        "Output file should be created by consolidateSelectedFiles command"
      );

      // Verify content of the output file
      const content = fs.readFileSync(selectedOutputPath, "utf8");
      assert.ok(
        content.includes("data/messages/test.txt"),
        "Output should contain test.txt content"
      );
      assert.ok(
        !content.includes("data/messages/.hidden"),
        "Output not contain .hidden files from directories"
      );
      assert.ok(
        content.includes("public/script.js"),
        "Output should contain script.js content"
      );
      assert.ok(
        content.includes(".hidden"),
        "Output should include .hidden files (when explicitly selected)"
      );
      assert.ok(
        content.includes("package-lock.json"),
        "Output should contain package-lock.json content"
      );
    } finally {
      // Restore the original input box
      vscode.window.showInputBox = originalShowInputBox;
    }
  });
});

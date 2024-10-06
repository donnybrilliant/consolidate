const assert = require("assert");
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

suite("Consolidate Test Suite", function () {
  this.timeout(10000); // Allow more time for VS Code to load

  let workspacePath;

  suiteSetup(async () => {
    // Ensure the workspace is loaded and get the workspace path
    const workspaceFolders = vscode.workspace.workspaceFolders;
    assert.ok(workspaceFolders, "Workspace should be open");

    workspacePath = workspaceFolders[0].uri.fsPath;
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
    assert.ok(
      commandList.includes("consolidate.consolidateSelectedEditorFiles"),
      'Command "consolidate.consolidateSelectedEditorFiles" should be registered'
    );
  });

  test("Check Workspace is Loaded", async () => {
    const testFilePath = path.join(workspacePath, "data/messages/test.txt");

    assert.ok(
      fs.existsSync(testFilePath),
      "Test file should exist in workspace"
    );
  });

  suite("Core Functionality Tests", function () {
    test("Consolidate All Files - Respects .gitignore and Hidden Files", async () => {
      const outputPath = path.join(workspacePath, "consolidated_output.txt");

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

        // Verify content of the output file
        const content = fs.readFileSync(outputPath, "utf8");
        assert.ok(
          content.includes("public/script.js"),
          "Output should contain script.js content"
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

        // Delete the output file
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      }
    });

    test("Consolidate Selected Files - Includes Explicitly Selected Hidden Files", async () => {
      const selectedOutputPath = path.join(
        workspacePath,
        "consolidated_selected_output.txt"
      );

      // Prepare URIs for selected files
      const selectedUris = [
        vscode.Uri.file(path.join(workspacePath, "public/script.js")),
        vscode.Uri.file(path.join(workspacePath, "public/.hidden")),
      ];

      // Mock the input box to automatically provide the output file name
      const originalShowInputBox = vscode.window.showInputBox;
      vscode.window.showInputBox = async () =>
        "consolidated_selected_output.txt";

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
          content.includes("public/script.js"),
          "Output should contain script.js content"
        );
        assert.ok(
          content.includes(".hidden"),
          "Output should include explicitly selected hidden files"
        );
      } finally {
        // Restore the original input box
        vscode.window.showInputBox = originalShowInputBox;

        // Delete the output file
        if (fs.existsSync(selectedOutputPath)) {
          fs.unlinkSync(selectedOutputPath);
        }
      }
    });

    test("Consolidate Selected Editor Files - Consolidates Open Tabs", async () => {
      const editorOutputPath = path.join(
        workspacePath,
        "consolidated_editor_output.txt"
      );

      // Open some files in the editor
      const fileUris = [
        vscode.Uri.file(path.join(workspacePath, "data/messages/test.txt")),
        vscode.Uri.file(path.join(workspacePath, "public/script.js")),
      ];

      for (const uri of fileUris) {
        const doc = await vscode.workspace.openTextDocument(uri);
        await vscode.window.showTextDocument(doc, { preview: false });
      }

      // Mock the input box
      const originalShowInputBox = vscode.window.showInputBox;
      vscode.window.showInputBox = async () => "consolidated_editor_output.txt";

      try {
        // Execute the command
        await vscode.commands.executeCommand(
          "consolidate.consolidateSelectedEditorFiles"
        );

        // Check if the file was created
        assert.ok(
          fs.existsSync(editorOutputPath),
          "Output file should be created by consolidateSelectedEditorFiles command"
        );

        // Verify content of the output file
        const content = fs.readFileSync(editorOutputPath, "utf8");
        assert.ok(
          content.includes("data/messages/test.txt"),
          "Output should contain test.txt content"
        );
        assert.ok(
          content.includes("public/script.js"),
          "Output should contain script.js content"
        );
      } finally {
        // Restore the original input box
        vscode.window.showInputBox = originalShowInputBox;

        // Close all editors
        await vscode.commands.executeCommand(
          "workbench.action.closeAllEditors"
        );

        // Delete the output file
        if (fs.existsSync(editorOutputPath)) {
          fs.unlinkSync(editorOutputPath);
        }
      }
    });
  });

  suite("Settings Tests", function () {
    test("Should create output file", async () => {
      const outputPath = path.join(
        workspacePath,
        "consolidated_output_createFile.txt"
      );

      // Mock the input box
      const originalShowInputBox = vscode.window.showInputBox;
      vscode.window.showInputBox = async () =>
        "consolidated_output_createFile.txt";

      try {
        // Execute the command
        await vscode.commands.executeCommand("consolidate.consolidateFiles");

        // Verify that the output file was created
        assert.ok(
          fs.existsSync(outputPath),
          "Output file should be created when createFile is true"
        );
      } finally {
        // Restore the original input box
        vscode.window.showInputBox = originalShowInputBox;

        // Delete the output file
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      }
    });

    test("Should open new editor tab", async () => {
      // Mock the input box
      const originalShowInputBox = vscode.window.showInputBox;
      vscode.window.showInputBox = async () =>
        "consolidated_output_openInNewTab.txt";

      // Variable to check if a new editor was opened
      let editorOpened = false;
      const editorOpenedPromise = new Promise((resolve) => {
        const disposable = vscode.window.onDidChangeVisibleTextEditors(
          (editors) => {
            if (editors.length > 0) {
              editorOpened = true;
              disposable.dispose();
              resolve();
            }
          }
        );
      });

      try {
        // Execute the command
        await vscode.commands.executeCommand("consolidate.consolidateFiles");

        // Wait for the editor to open
        await editorOpenedPromise;

        // Verify that a new editor was opened
        assert.ok(
          editorOpened,
          "A new editor tab should be opened when openInNewTab is true"
        );
      } finally {
        // Restore the original input box
        vscode.window.showInputBox = originalShowInputBox;

        // Close all editors
        await vscode.commands.executeCommand(
          "workbench.action.closeAllEditors"
        );

        // Clean up
        const outputPath = path.join(
          workspacePath,
          "consolidated_output_openInNewTab.txt"
        );
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      }
    });

    test("Should copy content to clipboard", async () => {
      // Mock the input box
      const originalShowInputBox = vscode.window.showInputBox;
      vscode.window.showInputBox = async () =>
        "consolidated_output_copyToClipboard.txt";

      // Mock the clipboard
      const originalClipboard = vscode.env.clipboard;
      let clipboardContent = "";
      vscode.env.clipboard = {
        writeText: async (text) => {
          clipboardContent = text;
        },
        readText: async () => clipboardContent,
      };

      try {
        // Execute the command
        await vscode.commands.executeCommand("consolidate.consolidateFiles");

        // Verify that the clipboard has content
        const clipboardData = await vscode.env.clipboard.readText();
        assert.ok(
          clipboardData.includes("public/script.js"),
          "Clipboard should contain consolidated content when copyToClipboard is true"
        );
      } finally {
        // Restore the original input box and clipboard
        vscode.window.showInputBox = originalShowInputBox;
        vscode.env.clipboard = originalClipboard;

        // Clean up
        const outputPath = path.join(
          workspacePath,
          "consolidated_output_copyToClipboard.txt"
        );
        if (fs.existsSync(outputPath)) {
          fs.unlinkSync(outputPath);
        }
      }
    });
  });
});

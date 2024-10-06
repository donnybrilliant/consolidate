const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

function activate(context) {
  // Command for consolidating all files, respecting .gitignore
  let consolidateAllCommand = vscode.commands.registerCommand(
    "consolidate.consolidateFiles",
    async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode.window.showErrorMessage("No workspace folder is open.");
        return;
      }

      const rootPath = workspaceFolders[0].uri.fsPath;
      const ig = require("ignore")();
      const gitignorePath = path.join(rootPath, ".gitignore");

      if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
        ig.add(gitignoreContent);
      }

      // Load custom ignore patterns
      ig.add(["package-lock.json", "yarn.lock", "*.log"]);

      let content = "";
      consolidateFiles(
        rootPath,
        ig,
        (fileContent) => {
          content += fileContent;
        },
        true
      ); // Exclude hidden files and respect .gitignore

      handleConsolidationResult(content, "consolidate.consolidateFiles");
    }
  );

  // Command for consolidating selected files, including folders
  let consolidateSelectedCommand = vscode.commands.registerCommand(
    "consolidate.consolidateSelectedFiles",
    async (uri, uris) => {
      const selectedUris = uris && uris.length > 0 ? uris : [uri];
      if (!selectedUris || selectedUris.length === 0) {
        vscode.window.showErrorMessage("No files or folders selected.");
        return;
      }

      const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
      const ig = require("ignore")();
      const gitignorePath = path.join(rootPath, ".gitignore");

      if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
        ig.add(gitignoreContent);
      }

      ig.add(["package-lock.json", "yarn.lock", "*.log"]);

      let content = "";

      selectedUris.forEach((fileUri) => {
        const stats = fs.statSync(fileUri.fsPath);
        if (stats.isDirectory()) {
          // For selected folders, bypass .gitignore but exclude hidden files
          consolidateFiles(
            fileUri.fsPath,
            null,
            (fileContent) => {
              content += fileContent;
            },
            true
          );
        } else if (stats.isFile()) {
          // Always include explicitly selected files, even if hidden or ignored
          const relativePath = path.relative(rootPath, fileUri.fsPath);
          const fileContent = `--- ${relativePath} ---\n${fs.readFileSync(
            fileUri.fsPath,
            "utf8"
          )}\n\n`;
          content += fileContent;
        }
      });

      handleConsolidationResult(
        content,
        "consolidate.consolidateSelectedFiles"
      );
    }
  );

  // Command for consolidating selected editor tabs
  let consolidateSelectedEditorFilesCommand = vscode.commands.registerCommand(
    "consolidate.consolidateSelectedEditorFiles",
    async () => {
      const editorGroups = vscode.window.tabGroups.all;
      let documents = [];

      editorGroups.forEach((group) => {
        group.tabs.forEach((tab) => {
          if (tab.input && tab.input instanceof vscode.TabInputText) {
            const document = vscode.workspace.textDocuments.find(
              (doc) => doc.uri.toString() === tab.input.uri.toString()
            );
            if (document) {
              documents.push(document);
            }
          }
        });
      });

      if (documents.length === 0) {
        vscode.window.showErrorMessage("No open tabs found.");
        return;
      }

      const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
      let content = "";

      documents.forEach((document) => {
        const relativePath = path.relative(rootPath, document.uri.fsPath);
        const fileContent = `--- ${relativePath} ---\n${document.getText()}\n\n`;
        content += fileContent;
      });

      handleConsolidationResult(
        content,
        "consolidate.consolidateSelectedEditorFiles"
      );
    }
  );

  // Handle the consolidated content based on user settings
  async function handleConsolidationResult(content) {
    const config = vscode.workspace.getConfiguration("consolidate");
    let outputPath;
    let createdFileUri;

    if (config.get("createFile")) {
      const outputFile = await vscode.window.showInputBox({
        placeHolder: "Enter output file name (e.g., consolidated_output.txt)",
        value: "consolidated_output.txt",
      });

      if (!outputFile) {
        vscode.window.showErrorMessage("Output file name is required.");
        return;
      }

      const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
      outputPath = path.join(rootPath, outputFile);
      fs.mkdirSync(path.dirname(outputPath), { recursive: true });
      fs.writeFileSync(outputPath, content, "utf8");
      vscode.window.showInformationMessage(
        `Files consolidated into ${path.relative(
          vscode.workspace.workspaceFolders[0].uri.fsPath,
          outputPath
        )}`
      );

      createdFileUri = vscode.Uri.file(outputPath);
    }

    if (
      config.get("createFile") &&
      config.get("openInNewTab") &&
      createdFileUri
    ) {
      vscode.workspace.openTextDocument(createdFileUri).then((doc) => {
        vscode.window.showTextDocument(doc);
      });
    } else if (config.get("openInNewTab")) {
      vscode.workspace.openTextDocument({ content }).then((doc) => {
        vscode.window.showTextDocument(doc);
      });
    }

    if (config.get("copyToClipboard")) {
      vscode.env.clipboard.writeText(content);
      vscode.window.showInformationMessage(
        "Consolidated content copied to clipboard"
      );
    }
  }

  context.subscriptions.push(consolidateAllCommand);
  context.subscriptions.push(consolidateSelectedCommand);
  context.subscriptions.push(consolidateSelectedEditorFilesCommand);
}

// Function to determine if a file should be ignored based on hidden status or .gitignore
function shouldIgnore(filePath, relativePath, ig, excludeHidden) {
  return (
    (excludeHidden && path.basename(filePath).startsWith(".")) ||
    (ig && ig.ignores(relativePath))
  );
}

// Recursive function to consolidate files within a directory
function consolidateFiles(directory, ig, callback, excludeHidden) {
  const files = fs.readdirSync(directory);
  files.forEach((file) => {
    const filePath = path.join(directory, file);
    const relativePath = path.relative(
      vscode.workspace.workspaceFolders[0].uri.fsPath,
      filePath
    );
    const stats = fs.statSync(filePath);

    // Exclude hidden files and apply .gitignore rules if ig is provided
    if (shouldIgnore(filePath, relativePath, ig, excludeHidden)) {
      return;
    }

    if (stats.isDirectory()) {
      consolidateFiles(filePath, ig, callback, excludeHidden); // Recursively consolidate subdirectories
    } else if (stats.isFile()) {
      const fileContent = `--- ${relativePath} ---\n${fs.readFileSync(
        filePath,
        "utf8"
      )}\n\n`;
      callback(fileContent);
    }
  });
}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};

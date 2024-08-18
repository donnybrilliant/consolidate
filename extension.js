const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

function activate(context) {
  // Command for consolidating all files, respecting .gitignore
  let consolidateAllCommand = vscode.commands.registerCommand(
    "extension.consolidateFiles",
    async () => {
      const workspaceFolders = vscode.workspace.workspaceFolders;
      if (!workspaceFolders) {
        vscode.window.showErrorMessage("No workspace folder is open.");
        return;
      }

      const outputFile = await vscode.window.showInputBox({
        placeHolder: "Enter output file name (e.g., consolidated_output.txt)",
        value: "consolidated_output.txt",
      });

      if (!outputFile) {
        vscode.window.showErrorMessage("Output file name is required.");
        return;
      }

      const rootPath = workspaceFolders[0].uri.fsPath;
      const outputPath = path.join(rootPath, outputFile);

      const ig = require("ignore")();
      const gitignorePath = path.join(rootPath, ".gitignore");

      if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
        ig.add(gitignoreContent);
      }

      // Load custom ignore patterns
      ig.add(["package-lock.json", "yarn.lock", "*.log"]);

      let content = "";
      consolidateFiles(rootPath, ig, (fileContent) => {
        content += fileContent;
      });

      fs.writeFileSync(outputPath, content, "utf8");
      vscode.window.showInformationMessage(
        `Files consolidated into ${outputPath}`
      );
    }
  );

  // Command for consolidating selected files, ignoring .gitignore and custom ignores
  let consolidateSelectedCommand = vscode.commands.registerCommand(
    "extension.consolidateSelectedFiles",
    async (uri, uris) => {
      // Handle both single and multiple selections
      const selectedUris = uris && uris.length > 0 ? uris : [uri];
      if (!selectedUris || selectedUris.length === 0) {
        vscode.window.showErrorMessage("No files selected.");
        return;
      }

      const outputFile = await vscode.window.showInputBox({
        placeHolder: "Enter output file name (e.g., consolidated_output.txt)",
        value: "consolidated_output.txt",
      });

      if (!outputFile) {
        vscode.window.showErrorMessage("Output file name is required.");
        return;
      }

      const rootPath = vscode.workspace.workspaceFolders[0].uri.fsPath;
      const outputPath = path.join(rootPath, outputFile);

      let content = "";

      selectedUris.forEach((fileUri) => {
        const relativePath = path.relative(rootPath, fileUri.fsPath);
        if (fs.statSync(fileUri.fsPath).isFile()) {
          const fileContent = `--- ${relativePath} ---\n${fs.readFileSync(
            fileUri.fsPath,
            "utf8"
          )}\n\n`;
          content += fileContent; // Append content of each selected file
        }
      });

      fs.writeFileSync(outputPath, content, "utf8");
      vscode.window.showInformationMessage(
        `Files consolidated into ${outputPath}`
      );
    }
  );

  context.subscriptions.push(consolidateAllCommand);
  context.subscriptions.push(consolidateSelectedCommand);
}

function consolidateFiles(directory, ig, callback) {
  const files = fs.readdirSync(directory);
  files.forEach((file) => {
    const filePath = path.join(directory, file);
    const relativePath = path.relative(
      vscode.workspace.workspaceFolders[0].uri.fsPath,
      filePath
    );
    const stats = fs.statSync(filePath);

    // Exclude hidden files/folders, custom ignores, and .gitignore exclusions
    if (file.startsWith(".") || ig.ignores(relativePath)) {
      return;
    }

    if (stats.isDirectory()) {
      consolidateFiles(filePath, ig, callback);
    } else {
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

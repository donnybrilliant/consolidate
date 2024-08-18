const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const ignore = require("ignore");

function activate(context) {
  let disposable = vscode.commands.registerCommand(
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

      // Initialize the ignore instance
      const ig = ignore();

      // Load custom ignore patterns
      ig.add(["package-lock.json", "yarn.lock", "*.log"]);

      // Check for a .gitignore file and add its contents to the ignore instance
      const gitignorePath = path.join(rootPath, ".gitignore");
      if (fs.existsSync(gitignorePath)) {
        const gitignoreContent = fs.readFileSync(gitignorePath, "utf8");
        ig.add(gitignoreContent);
      }

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

  context.subscriptions.push(disposable);
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

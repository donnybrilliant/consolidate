const vscode = require("vscode");
const fs = require("fs");
const path = require("path");

async function activate(context) {
  // Register commands and run them through handleCommand
  context.subscriptions.push(
    vscode.commands.registerCommand("consolidate.consolidateFiles", () => {
      handleCommand(context, consolidateAllFiles);
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "consolidate.consolidateSelectedFiles",
      (uri, uris) => {
        handleCommand(context, () => consolidateSelectedFiles(uri, uris));
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "consolidate.consolidateSelectedEditorFiles",
      () => {
        handleCommand(context, consolidateSelectedEditorFiles);
      }
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "consolidate.configureSettings",
      configureSettings
    )
  );
}

// Function to handle running the command, checking if settings are configured first
async function handleCommand(context, commandToRun) {
  const firstRunKey = "consolidate.firstRun";
  const isFirstRun =
    process.env.NODE_ENV === "test"
      ? false
      : context.globalState.get(firstRunKey, true);

  if (isFirstRun) {
    // If it's the first run, store the command in workspaceState and configure settings
    context.workspaceState.update("pendingCommand", commandToRun); // Store pending command
    await vscode.commands.executeCommand("consolidate.configureSettings");
    context.globalState.update(firstRunKey, false);

    // Retrieve and run the pending command, if any
    const pendingCommand = context.workspaceState.get("pendingCommand", null);
    if (pendingCommand) {
      pendingCommand(); // Execute the stored command
      context.workspaceState.update("pendingCommand", null); // Clear after execution
    }
  } else {
    // If not the first run, execute the command directly
    await commandToRun();
  }
}

// Command: Consolidate all files
async function consolidateAllFiles() {
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

  // Handle the consolidated result
  handleConsolidationResult(content);
}

// Command for consolidating selected files, including folders
async function consolidateSelectedFiles(uri, uris) {
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
      consolidateFiles(
        fileUri.fsPath,
        null,
        (fileContent) => {
          content += fileContent;
        },
        true
      );
    } else if (stats.isFile()) {
      const relativePath = path.relative(rootPath, fileUri.fsPath);
      const fileContent = `--- ${relativePath} ---\n${fs.readFileSync(
        fileUri.fsPath,
        "utf8"
      )}\n\n`;
      content += fileContent;
    }
  });

  // Handle the consolidated result
  handleConsolidationResult(content);
}

// Command for consolidating selected editor tabs
async function consolidateSelectedEditorFiles() {
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

  // Handle the consolidated result
  handleConsolidationResult(content);
}

// Command: Configure settings
async function configureSettings() {
  const config = vscode.workspace.getConfiguration("consolidate");
  const selections = await vscode.window.showQuickPick(
    [
      {
        label: "Create File",
        picked: config.get("createFile"),
        description: "Consolidate files into a new output file",
      },
      {
        label: "Open in New Tab",
        picked: config.get("openInNewTab"),
        description: "Open the consolidated content in a new tab",
      },
      {
        label: "Copy to Clipboard",
        picked: config.get("copyToClipboard"),
        description: "Copy the consolidated content to the clipboard",
      },
    ],
    {
      canPickMany: true,
      placeHolder:
        "Select options for how you want to use the Consolidate extension",
    }
  );

  if (selections) {
    const selectedLabels = selections.map((selection) => selection.label);
    await config.update(
      "createFile",
      selectedLabels.includes("Create File"),
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      "openInNewTab",
      selectedLabels.includes("Open in New Tab"),
      vscode.ConfigurationTarget.Global
    );
    await config.update(
      "copyToClipboard",
      selectedLabels.includes("Copy to Clipboard"),
      vscode.ConfigurationTarget.Global
    );
  }
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

// Function to determine if a file should be ignored based on hidden status or .gitignore
function shouldIgnore(filePath, relativePath, ig, excludeHidden) {
  return (
    (excludeHidden && path.basename(filePath).startsWith(".")) ||
    (ig && ig.ignores(relativePath))
  );
}

// Handle the consolidated content based on user settings
async function handleConsolidationResult(content) {
  const config = vscode.workspace.getConfiguration("consolidate");

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
    const outputPath = path.join(rootPath, outputFile);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, content, "utf8");
    vscode.window.showInformationMessage(
      `Files consolidated into ${path.relative(rootPath, outputPath)}`
    );

    const createdFileUri = vscode.Uri.file(outputPath);
    if (config.get("openInNewTab")) {
      vscode.workspace.openTextDocument(createdFileUri).then((doc) => {
        vscode.window.showTextDocument(doc);
      });
    }
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

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};

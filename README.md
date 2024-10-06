# Consolidate

![Version](https://img.shields.io/badge/version-0.2.0-blue.svg)
![VS Code](https://img.shields.io/badge/VSCode-1.92.0+-blue.svg)

## Overview

The **Consolidate** extension for Visual Studio Code allows you to quickly consolidate all or selected files from your workspace into a single text file. This is particularly useful for sharing project files in a single document, reviewing multiple files at once, or even preparing files for use in AI tools like GPT, where referencing multiple files in a web prompt can be challenging.

## Features

- **Consolidate All Files**: Merge all workspace files into one, respecting .gitignore and hidden files.
- **Consolidate Selected Files**: Merge contents of selected files or folders.
- **Customizable Output**: Choose to create a file, open in a new tab, or copy to the clipboard.

## Usage

### 1. First-Run Configuration

When you run the Consolidate extension for the first time, set your preferred method:

- **Create File:** Consolidate files into a new output file.
- **Open in New Tab:** Open the consolidated content in a new editor tab.
- **Copy to Clipboard:** Copy the consolidated content to your clipboard.

Once you’ve configured these settings, they will persist for future use. On subsequent runs, the extension will use these saved preferences.

### 2. Consolidate All Files

1. Open the command palette (`Cmd+Shift+P` on macOS, `Ctrl+Shift+P` on Windows/Linux).
2. Run `Consolidate Files`.

Alternatively, right-click in the Explorer panel, with no files selected and choose `Consolidate All Files`.

### 3. Consolidate Selected Files

1. Select the files or folders in the explorer or open tabs that you want to consolidate.
2. Right-click and choose `Consolidate Selected Files`.

## Installation

1. Open VS Code.
2. Go to the Extensions view (`Cmd+Shift+X` on macOS, `Ctrl+Shift+X` on Windows/Linux).
3. Search for `Consolidate Files`.
4. Click `Install`.

## Configuration

### First-Run Configuration

Upon running the extension for the first time, you will be prompted to select default behaviors for how consolidated content should be handled (create a file, copy to clipboard, open new tab).

You can change how the extension handles consolidated content at any time:

1. Open the command palette (`Cmd+Shift+P`).
2. Type `Consolidate: Configure Settings`.
3. Select your new preferred options.

## Requirements

- Visual Studio Code `1.92.0` or higher.

## Release Notes

See the [CHANGELOG](CHANGELOG.md) for details.

## License

MIT License. See [LICENSE](LICENSE) for more information.

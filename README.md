# Consolidate - VS Code Extension

![Version](https://img.shields.io/badge/version-0.1.1-blue.svg)
![VS Code](https://img.shields.io/badge/VSCode-1.92.0+-blue.svg)

## Overview

The **Consolidate** extension for Visual Studio Code allows you to quickly consolidate all or selected files from your workspace into a single text file. This is particularly useful for sharing project files in a single document, reviewing multiple files at once, or even preparing files for use in AI tools like GPT, where referencing multiple files in a web prompt can be challenging.

## Features

- **Consolidate All Files**: Combines the contents of all files in your workspace into a single output file, respecting `.gitignore` and hidden files.
- **Consolidate Selected Files**: Right-click on selected files or folders in the explorer to combine their contents into a single output file, with the option to include hidden or ignored files.
- **Custom Output File Name**: Easily specify the name of the output file.

## Usage

### 1. Consolidate All Files

1. Open the command palette (`Cmd+Shift+P` on macOS, `Ctrl+Shift+P` on Windows/Linux).
2. Type `Consolidate Files` and press `Enter`.
3. Enter the desired output file name (e.g., `consolidated_output.txt`).
4. The contents of all non-hidden, non-ignored files will be consolidated into the specified file.

### 2. Consolidate Selected Files

1. Select the files or folders in the explorer that you want to consolidate.
2. Right-click and choose `Consolidate Selected Files`.
3. Enter the desired output file name.
4. The contents of the selected files will be consolidated into the specified file.

## Installation

1. Open VS Code.
2. Go to the Extensions view (`Cmd+Shift+X` on macOS, `Ctrl+Shift+X` on Windows/Linux).
3. Search for `Consolidate Files`.
4. Click `Install`.

## Configuration

No additional configuration is required.

## Requirements

- Visual Studio Code `1.92.0` or higher.

## Release Notes

See the [CHANGELOG](CHANGELOG.md) for details.

## License

MIT License. See [LICENSE](LICENSE) for more information.

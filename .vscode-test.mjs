import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "test/**/*.test.js",
  workspaceFolder: "./test/fixtures/workspace",
});

// tslint:disable object-literal-sort-keys

import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as vscode from "vscode";
import * as client from "./client";
import { register as registerOcamlForamtter } from "./formatters/ocaml";
import { register as registerReasonForamtter } from "./formatters/reason";
import reasonConfiguration from "./reasonConfiguration";
import { generateEsyConfig, isBucklescriptProject } from "./utils";

const esyCheckInterval = 1000;

export async function activate(context: vscode.ExtensionContext) {
  let wasEsyErrorShown = false;
  let esyCheckIntervalId: NodeJS.Timer;

  function start() {
    if (!vscode.workspace.rootPath) return;

    initEsy();

    try {
      execSync("esy exec-command which ocamlmerlin-lsp", { cwd: vscode.workspace.rootPath });
      client.launch(context);
      clearInterval(esyCheckIntervalId);
    } catch (e) {
      if (!esyCheckIntervalId) esyCheckIntervalId = setInterval(start, esyCheckInterval);

      if (!wasEsyErrorShown) {
        vscode.window.showInformationMessage("esy or merlin-lsp error");
        wasEsyErrorShown = true;
      }
    }
  }

  async function initEsy() {
    // TODO: add esy generation for non-bs projects
    if (!isBucklescriptProject) return;
    if (!vscode.workspace.rootPath) return;

    const esyJsonPath = path.join(vscode.workspace.rootPath, "esy.json");
    if (fs.existsSync(esyJsonPath)) return;

    const esyConfig = generateEsyConfig(vscode.workspace.rootPath);

    if (!esyConfig) {
      vscode.window.showInformationMessage("bs-platform not found in devDependencies");
      return;
    }

    const choice = await vscode.window.showQuickPick(
      [
        {
          description: "An `esy.json` file will be created on the root of the project.",
          label: "Yes",
        },
        {
          description: "The extension will not provide any diagnostics without it.",
          label: "No",
        },
      ],
      { placeHolder: "`esy.json` was not found in the project. Do you want the extension to create one for you?" },
    );

    if (choice && choice.label === "Yes") {
      fs.writeFileSync(esyJsonPath, esyConfig);
      vscode.window.showQuickPick(
        [
          {
            description: "",
            label: "Ok",
          },
        ],
        { placeHolder: "All good. Now run `esy`" },
      );

      // Waiting for dependencies to be installed
      esyCheckIntervalId = setInterval(start, esyCheckInterval);
    }
  }

  context.subscriptions.push(vscode.languages.setLanguageConfiguration("reason", reasonConfiguration));
  registerOcamlForamtter();
  registerReasonForamtter();

  vscode.commands.registerCommand("reason.restart", start);
  vscode.commands.registerCommand("reason.init", initEsy);
  start();
}

export function deactivate() {
  return;
}

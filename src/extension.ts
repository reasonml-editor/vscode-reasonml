// tslint:disable object-literal-sort-keys
import * as vscode from "vscode";
import * as client from "./client";
import { register as registerOcamlForamtter } from "./formatters/ocaml";
import { register as registerReasonForamtter } from "./formatters/reason";
import reasonConfiguration from "./reasonConfiguration";

export async function activate(context: vscode.ExtensionContext) {
  function start() {
    client.launch(context);
  }

  context.subscriptions.push(vscode.languages.setLanguageConfiguration("reason", reasonConfiguration));
  registerOcamlForamtter();
  registerReasonForamtter();

  vscode.commands.registerCommand("reason.restart", start);
  start();
}

export function deactivate() {
  return;
}

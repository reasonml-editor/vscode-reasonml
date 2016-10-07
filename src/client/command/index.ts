import * as caseSplit from "./caseSplit";
import * as getPrefix from "./getPrefix";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";

export function registerAll(context: vscode.ExtensionContext, reasonClient: client.LanguageClient): void {
  getPrefix.register(context, reasonClient);
  caseSplit.register(context, reasonClient);
}

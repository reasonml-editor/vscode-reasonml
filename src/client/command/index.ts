import * as caseSplit from "./caseSplit";
import * as getText from "./getText";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";

export function registerAll(context: vscode.ExtensionContext, reasonClient: client.LanguageClient): void {
  getText.register(reasonClient);
  caseSplit.register(context, reasonClient);
}

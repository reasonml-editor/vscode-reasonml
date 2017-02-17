import * as vscode from "vscode";
import * as client from "vscode-languageclient";
import * as onDidSaveTextDocument from "./onDidSaveTextDocument";

export function registerAll(context: vscode.ExtensionContext, languageClient: client.LanguageClient): void {
  onDidSaveTextDocument.register(context, languageClient);
}

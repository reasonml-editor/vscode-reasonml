import * as vscode from "vscode";
import * as client from "vscode-languageclient";
import * as onWillSaveTextDocument from "./onWillSaveTextDocument";

export function registerAll(context: vscode.ExtensionContext, languageClient: client.LanguageClient): void {
  onWillSaveTextDocument.register(context, languageClient);
}

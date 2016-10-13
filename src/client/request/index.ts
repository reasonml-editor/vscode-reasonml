import * as givePrefix from "./givePrefix";
import * as giveTextDocument from "./giveTextDocument";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";

export function registerAll(context: vscode.ExtensionContext, reasonClient: client.LanguageClient): void {
  givePrefix.register(context, reasonClient);
  giveTextDocument.register(context, reasonClient);
}

import * as givePrefix from "./givePrefix";
import * as giveText from "./giveText";
import * as giveTextDocument from "./giveTextDocument";
import * as giveWordAtPosition from "./giveWordAtPosition";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";

export function registerAll(context: vscode.ExtensionContext, languageClient: client.LanguageClient): void {
  givePrefix.register(context, languageClient);
  giveText.register(context, languageClient);
  giveTextDocument.register(context, languageClient);
  giveWordAtPosition.register(context, languageClient);
}

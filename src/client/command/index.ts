import * as doShowMerlinFiles from "./doShowMerlinFiles";
import * as doSplitCases from "./doSplitCases";
import * as fixMissingSemicolon from "./fixMissingSemicolon";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";

export function registerAll(context: vscode.ExtensionContext, languageClient: client.LanguageClient): void {
  doShowMerlinFiles.register(context, languageClient);
  doSplitCases.register(context, languageClient);
  fixMissingSemicolon.register(context);
}

import * as doShowMerlinFiles from "./doShowMerlinFiles";
import * as doSplitCases from "./doSplitCases";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";

export function registerAll(context: vscode.ExtensionContext, reasonClient: client.LanguageClient): void {
  doShowMerlinFiles.register(context, reasonClient);
  doSplitCases.register(context, reasonClient);
}

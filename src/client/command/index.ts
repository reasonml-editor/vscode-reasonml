import * as vscode from "vscode";
import * as client from "vscode-languageclient";
import * as doShowAvailableLibraries from "./doShowAvailableLibraries";
import * as doShowMerlinFiles from "./doShowMerlinFiles";
import * as doShowProjectEnv from "./doShowProjectEnv";
import * as doSplitCases from "./doSplitCases";
import * as fixEqualsShouldBeArrow from "./fixEqualsShouldBeArrow";
import * as fixMissingSemicolon from "./fixMissingSemicolon";
import * as fixUnusedVariable from "./fixUnusedVariable";

export function registerAll(context: vscode.ExtensionContext, languageClient: client.LanguageClient): void {
  doShowMerlinFiles.register(context, languageClient);
  doShowProjectEnv.register(context, languageClient);
  doShowAvailableLibraries.register(context, languageClient);
  doSplitCases.register(context, languageClient);
  fixEqualsShouldBeArrow.register(context, languageClient);
  fixMissingSemicolon.register(context, languageClient);
  fixUnusedVariable.register(context, languageClient);
}

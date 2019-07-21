import * as vscode from "vscode";
import * as client from "vscode-languageclient";
import * as fixEqualsShouldBeArrow from "./fixEqualsShouldBeArrow";
import * as fixMissingSemicolon from "./fixMissingSemicolon";
import * as fixUnusedVariable from "./fixUnusedVariable";

export function registerAll(context: vscode.ExtensionContext, languageClient: client.LanguageClient): void {
  fixEqualsShouldBeArrow.register(context, languageClient);
  fixMissingSemicolon.register(context, languageClient);
  fixUnusedVariable.register(context, languageClient);
}

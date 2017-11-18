import { remote } from "ocaml-language-server";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";

export function register(
  _context: vscode.ExtensionContext,
  languageClient: client.LanguageClient,
): void {
  languageClient.onRequest(remote.client.clearDiagnostics, () => {
    const diagnostics = languageClient.diagnostics;
    if (diagnostics) {
      // vscode.window.showInformationMessage("clearDiagnostics");
      diagnostics.clear();
    }
  });
}

import { remote } from "ocaml-language-server";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";
import * as LSP from "vscode-languageserver-protocol";

export function register(context: vscode.ExtensionContext, languageClient: client.LanguageClient): void {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand("reason.showAvailableLibraries", async editor => {
      const docURI: LSP.TextDocumentIdentifier = {
        uri: editor.document.uri.toString(),
      };
      const libraryLines = languageClient.sendRequest(remote.server.giveAvailableLibraries, docURI);
      await vscode.window.showQuickPick(libraryLines);
      return;
    }),
  );
}

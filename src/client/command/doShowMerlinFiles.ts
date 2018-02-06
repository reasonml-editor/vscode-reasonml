import { remote } from "ocaml-language-server";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";
import * as LSP from "vscode-languageserver-protocol";

export function register(context: vscode.ExtensionContext, languageClient: client.LanguageClient): void {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand("reason.showMerlinFiles", async editor => {
      const docURI: LSP.TextDocumentIdentifier = {
        uri: editor.document.uri.toString(),
      };
      const merlinFiles: string[] = await languageClient.sendRequest(remote.server.giveMerlinFiles, docURI);
      const selected: string | undefined = await vscode.window.showQuickPick(merlinFiles);
      if (null == selected) return;
      const textDocument = await vscode.workspace.openTextDocument(selected);
      await vscode.window.showTextDocument(textDocument);
    }),
  );
}

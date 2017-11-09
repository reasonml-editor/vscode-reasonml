import { types } from "ocaml-language-server";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";

// FIXME: delete this and use from "ocaml-language-server" instead
const giveMerlinFiles = new client.RequestType<
  types.TextDocumentIdentifier,
  string[],
  void,
  void
>("reason.server.giveMerlinFiles");

export function register(context: vscode.ExtensionContext, languageClient: client.LanguageClient): void {
  context.subscriptions.push(vscode.commands.registerTextEditorCommand("reason.showMerlinFiles", async (editor) => {
    const docURI: types.TextDocumentIdentifier = { uri: editor.document.uri.toString() };
    const merlinFiles: string[] = await languageClient.sendRequest(giveMerlinFiles, docURI);
    const selected: string | undefined = await vscode.window.showQuickPick(merlinFiles);
    if (selected == null) return;
    const textDocument = await vscode.workspace.openTextDocument(selected);
    await vscode.window.showTextDocument(textDocument);
  }));
}

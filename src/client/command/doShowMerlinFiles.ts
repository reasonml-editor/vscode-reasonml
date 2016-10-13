import { remote, types } from "../../shared";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";

export function register(context: vscode.ExtensionContext, languageClient: client.LanguageClient): void {
  context.subscriptions.push(vscode.commands.registerTextEditorCommand("reason.showMerlinFiles", async (editor) => {
    const docURI: types.TextDocumentIdentifier = { uri: editor.document.uri.toString() };
    const merlinFiles = await languageClient.sendRequest(remote.server.giveMerlinFiles, docURI);
    const selected = await vscode.window.showQuickPick(merlinFiles);
    const textDocument = await vscode.workspace.openTextDocument(selected);
    await vscode.window.showTextDocument(textDocument);
  }));
}

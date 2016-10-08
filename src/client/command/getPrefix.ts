import * as vscode from "vscode";
import * as client from "vscode-languageclient";

export function register(context: vscode.ExtensionContext, reasonClient: client.LanguageClient): void {
  void context; // tslint:disable-line
  const method = { method: "getPrefix" };
  reasonClient.onRequest<client.TextDocumentPositionParams, null | string, void>(method, async (event) => {
    const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(event.textDocument.uri));
    const pattern = /[A-Za-z_][A-Za-z_'0-9]*(?:\.[A-Za-z_][A-Za-z_'0-9]*)*\.?$/;
    const range = new vscode.Range(
      new vscode.Position(event.position.line, 0),
      new vscode.Position(event.position.line, event.position.character));
    const match = pattern.exec(document.getText(range));
    return match[0] || null;
  });
}

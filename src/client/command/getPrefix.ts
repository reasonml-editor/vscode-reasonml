import * as vscode from "vscode";
import * as client from "vscode-languageclient";

export function register(context: vscode.ExtensionContext, reasonClient: client.LanguageClient): void {
  void context; // tslint:disable-line
  reasonClient.onRequest<client.TextDocumentPositionParams, null | string, void>(
    { method: "getPrefix" },
    async (event) => {
      const range = new vscode.Range(
        new vscode.Position(event.position.line, 0),
        new vscode.Position(event.position.line, event.position.character));
      const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(event.textDocument.uri));
      const pattern = /[A-Za-z_][A-Za-z_'0-9]*(?:\.[A-Za-z_][A-Za-z_'0-9]*)*\.?$/;
      const match = pattern.exec(document.getText(range));
      return match[0] ? match[0] : null;
    });
}

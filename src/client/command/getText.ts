import * as vscode from "vscode";
import * as client from "vscode-languageclient";

export function register(reasonClient: client.LanguageClient): void {
  reasonClient.onRequest<client.TextDocumentPositionParams, string | undefined, void>(
    { method: "getText" },
    async (event) => {
      const range = new vscode.Range(
        new vscode.Position(event.position.line, 0),
        new vscode.Position(event.position.line, event.position.character));
      const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(event.textDocument.uri));
      const pattern = /[A-Za-z_][A-Za-z_'0-9]*(?:\.[A-Za-z_][A-Za-z_'0-9]*)*\.?$/;
      const match = pattern.exec(document.getText(range));
      return match[0] ? match[0] : undefined;
    });
}

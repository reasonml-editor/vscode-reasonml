import * as vscode from "vscode";
import * as client from "vscode-languageclient";

// FIXME: delete this and use from "ocaml-language-server" instead
const givePrefix = new client.RequestType<
  client.TextDocumentPositionParams,
  null | string,
  void,
  void
>("reason.client.givePrefix");

async function handler(event: client.TextDocumentPositionParams): Promise<null | string> {
  const document = await vscode.workspace.openTextDocument(vscode.Uri.parse(event.textDocument.uri));
  const pattern = /[A-Za-z_][A-Za-z_'0-9]*(?:\.[A-Za-z_][A-Za-z_'0-9]*)*\.?$/;
  const range = new vscode.Range(
    new vscode.Position(event.position.line, 0),
    new vscode.Position(event.position.line, event.position.character));
  const match = pattern.exec(document.getText(range));
  return match ? match[0] : null;
}

export function register(context: vscode.ExtensionContext, languageClient: client.LanguageClient): void {
  void context; // tslint:disable-line
  languageClient.onRequest(givePrefix, handler);
}

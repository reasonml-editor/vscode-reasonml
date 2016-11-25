import * as vscode from "vscode";
import * as client from "vscode-languageclient";
import { remote, types } from "../../shared";

async function handler(event: types.TextDocumentIdentifier): Promise<types.TextDocumentData> {
  const codeDoc = await vscode.workspace.openTextDocument(vscode.Uri.parse(event.uri));
  const content = codeDoc.getText();
  const languageId = codeDoc.languageId;
  const version = codeDoc.version;
  return { content, languageId, version };
}

export function register(context: vscode.ExtensionContext, languageClient: client.LanguageClient): void {
  void context; // tslint:disable-line
  languageClient.onRequest(remote.client.giveTextDocument, handler);
}

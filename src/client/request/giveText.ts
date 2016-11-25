import * as vscode from "vscode";
import * as client from "vscode-languageclient";
import { remote, types } from "../../shared";

async function handler({ range, uri }: types.Location): Promise<string> {
  const textDocument = await vscode.workspace.openTextDocument(vscode.Uri.parse(uri));
  const content = textDocument.getText(client.Protocol2Code.asRange(range));
  return content;
}

export function register(context: vscode.ExtensionContext, languageClient: client.LanguageClient): void {
  void context; // tslint:disable-line
  languageClient.onRequest(remote.client.giveText, handler);
}

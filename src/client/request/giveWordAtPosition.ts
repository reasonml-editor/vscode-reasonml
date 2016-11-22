import { remote, types } from "../../shared";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";

async function handler({ position: positionWire, uri }: types.ILocatedPosition): Promise<string> {
  const textDocument = await vscode.workspace.openTextDocument(vscode.Uri.parse(uri));
  const positionCode = client.Protocol2Code.asPosition(positionWire);
  const range = textDocument.getWordRangeAtPosition(positionCode);
  return textDocument.getText(range);
}

export function register(context: vscode.ExtensionContext, languageClient: client.LanguageClient): void {
  void context; // tslint:disable-line
  languageClient.onRequest(remote.client.giveWordAtPosition, handler);
}

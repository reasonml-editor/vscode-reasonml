import { remote, types } from "ocaml-language-server";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";

function handler(
  languageClient: client.LanguageClient,
): (
  { position: positionWire, uri }: types.ILocatedPosition,
) => Promise<string> {
  return async ({ position: positionWire, uri }) => {
    const textDocument = await vscode.workspace.openTextDocument(
      vscode.Uri.parse(uri),
    );
    const positionCode = languageClient.protocol2CodeConverter.asPosition(
      positionWire,
    );
    const range = textDocument.getWordRangeAtPosition(positionCode);
    return textDocument.getText(range);
  };
}

export function register(
  context: vscode.ExtensionContext,
  languageClient: client.LanguageClient,
): void {
  void context; // tslint:disable-line
  languageClient.onRequest(
    remote.client.giveWordAtPosition.method,
    handler(languageClient),
  );
}

import { remote, types } from "ocaml-language-server";
import * as vscode from "vscode";
import { LanguageClient } from "vscode-languageclient";

function handler(
  client: LanguageClient,
): ({ range, uri }: types.Location) => Promise<string> {
  return async ({ range, uri }) => {
    const textDocument = await vscode.workspace.openTextDocument(
      vscode.Uri.parse(uri),
    );
    const content = textDocument.getText(
      client.protocol2CodeConverter.asRange(range),
    );
    return content;
  };
}

export function register(
  context: vscode.ExtensionContext,
  client: LanguageClient,
): void {
  void context; // tslint:disable-line
  client.onRequest(remote.client.giveText.method, handler(client));
}

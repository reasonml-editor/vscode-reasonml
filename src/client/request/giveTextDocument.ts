import { types } from "ocaml-language-server";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";

// FIXME: delete this and use from "ocaml-language-server" instead
const giveTextDocument = new client.RequestType<
  client.TextDocumentIdentifier,
  types.ITextDocumentData,
  void,
  void
>("reason.client.giveTextDocument");

async function handler(
  event: types.TextDocumentIdentifier,
): Promise<types.ITextDocumentData> {
  const codeDoc = await vscode.workspace.openTextDocument(
    vscode.Uri.parse(event.uri),
  );
  const content = codeDoc.getText();
  const languageId = codeDoc.languageId;
  const version = codeDoc.version;
  return { content, languageId, version };
}

export function register(
  context: vscode.ExtensionContext,
  languageClient: client.LanguageClient,
): void {
  void context; // tslint:disable-line
  languageClient.onRequest(giveTextDocument, handler);
}

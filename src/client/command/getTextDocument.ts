import * as types from "../../shared/types";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";

export function register(context: vscode.ExtensionContext, reasonClient: client.LanguageClient): void {
  void context; // tslint:disable-line
  const method = { method: "getTextDocument" };
  reasonClient.onRequest<types.TextDocumentIdentifier, types.TextDocumentData, void>(method, async (event) => {
    const codeDoc = await vscode.workspace.openTextDocument(vscode.Uri.parse(event.uri));
    const content = codeDoc.getText();
    const languageId = codeDoc.languageId;
    const version = codeDoc.version;
    return { content, languageId, version };
  });
}

import * as vscode from "vscode";
import * as client from "vscode-languageclient";
import { remote } from "../../shared";

async function execute(editor: vscode.TextEditor, formattedText: string): Promise<boolean> {
  const lastLine = editor.document.lineCount - 1;

  return editor.edit((editBuilder) => {
    const fullRange = new vscode.Range(
      new vscode.Position(0, 0),
      new vscode.Position(lastLine, editor.document.lineAt(lastLine).text.length)
    );

    editBuilder.replace(fullRange, formattedText)
  });
}

export function register(context: vscode.ExtensionContext, languageClient: client.LanguageClient): void {
  /*
    Vscode doesn't support a pre-save hook atm.
    When formatting a file we need to make sure the document is
    saved again (with the formatting applied).
    This could result in an unlimited loop:
    save -> refmt -> save again -> refmt again -> save etc.
    By introducing an 'ignoreNextSave' we can avoid the
    'refmt again' part when a 'save again' happens.
    (This code is heavily inspired from the vscode Go extension)
  */
  const ignoreNextSave = new WeakSet<vscode.TextDocument>();

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async(textDocument: vscode.TextDocument) => {
      if (ignoreNextSave.has(textDocument)) {
        return;
      }
      try {
        const unformattedDoc = {
          content: textDocument.getText(),
          languageId: textDocument.languageId,
          uri: textDocument.uri.toString(),
          version: textDocument.version,
        };

        const response = await languageClient.sendRequest(remote.server.giveFormatted, unformattedDoc);

        if (response !== null) {
          const textEditor = vscode.window.activeTextEditor;
          await execute(textEditor, response);
          ignoreNextSave.add(textDocument);
          await textDocument.save();
          ignoreNextSave.delete(textDocument);
        }
      } catch (error) {
        vscode.window.showErrorMessage("Something went wrong while letting refmt work it's magic on your code, perhaps a syntax error?");
      }
    }));
}

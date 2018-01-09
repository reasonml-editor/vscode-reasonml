import * as vscode from "vscode";
import * as client from "vscode-languageclient";
import * as LSP from "vscode-languageserver-protocol";

export function register(context: vscode.ExtensionContext, languageClient: client.LanguageClient): void {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      "reason.codeAction.fixEqualsShouldBeArrow",
      async (editor: vscode.TextEditor, _: any, [{ range: { end: position } }]: [LSP.Location]): Promise<void> => {
        await editor.edit(editBuilder => {
          const editPosition = languageClient.protocol2CodeConverter.asPosition(position);
          editBuilder.insert(editPosition, ">");
        });
      },
    ),
  );
}

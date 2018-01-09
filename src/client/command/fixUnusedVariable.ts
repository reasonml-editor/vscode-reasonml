import * as vscode from "vscode";
import * as client from "vscode-languageclient";
import * as LSP from "vscode-languageserver-protocol";

export function register(context: vscode.ExtensionContext, languageClient: client.LanguageClient): void {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      "reason.codeAction.fixUnusedVariable",
      async (editor: vscode.TextEditor, _: any, [{ range }, name]: [LSP.Location, string]): Promise<void> => {
        await editor.edit(editBuilder => {
          const editRange = languageClient.protocol2CodeConverter.asRange(range);
          editBuilder.replace(editRange, `_${name}`);
        });
      },
    ),
  );
}

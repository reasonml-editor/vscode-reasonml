import { types } from "ocaml-language-server";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";

export function register(
  context: vscode.ExtensionContext,
  languageClient: client.LanguageClient,
): void {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand(
      "reason.codeAction.fixUnusedVariable",
      async (
        editor: vscode.TextEditor,
        _: any,
        [{ range }, name]: [types.Location, string],
      ): Promise<void> => {
        await editor.edit(editBuilder => {
          const editRange = languageClient.protocol2CodeConverter.asRange(
            range,
          );
          editBuilder.replace(editRange, `_${name}`);
        });
      },
    ),
  );
}

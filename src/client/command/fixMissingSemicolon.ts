import * as vscode from "vscode";
import * as client from "vscode-languageclient";
import { types } from "../../shared";

export function register(context: vscode.ExtensionContext): void {
  context.subscriptions.push(vscode.commands.registerTextEditorCommand("reason.codeAction.fixMissingSemicolon",
    async (editor: vscode.TextEditor, _: any, [{ range: { end: position }}]: [types.Location]): Promise<void> => {
      await editor.edit((editBuilder) => {
        const editPosition = client.Protocol2Code.asPosition(position);
        editBuilder.insert(editPosition, ";");
      });
    }));
}

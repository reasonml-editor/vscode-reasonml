import { execSync } from "child_process";
import * as path from "path";
import * as vscode from "vscode";
import { getFullTextRange } from "./utils";

export function register() {
  const configuration = vscode.workspace.getConfiguration("ocaml-reason-format");
  const rootPath = vscode.workspace.rootPath || "";

  vscode.languages.registerDocumentFormattingEditProvider("reason", {
    provideDocumentFormattingEdits(_document: vscode.TextDocument): vscode.TextEdit[] {
      const formatterPath = configuration.get<string | undefined>("refmt");
      const formatter = formatterPath ? path.resolve(rootPath, formatterPath) : "refmt";
      const textEditor = vscode.window.activeTextEditor;

      if (textEditor) {
        const text = textEditor.document.getText();
        const formattedText = execSync(`${formatter} <<<'${text}'`).toString();
        const textRange = getFullTextRange(textEditor);

        return [vscode.TextEdit.replace(textRange, formattedText)];
      } else {
        return [];
      }
    },
  });
}

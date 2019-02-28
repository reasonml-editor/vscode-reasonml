import { execSync } from "child_process";
import * as path from "path";
import * as vscode from "vscode";
import { getFullTextRange } from "./utils";

export function register() {
  const configuration = vscode.workspace.getConfiguration("ocaml-reason-format");
  const rootPath = vscode.workspace.rootPath || "";

  vscode.languages.registerDocumentFormattingEditProvider("ocaml", {
    provideDocumentFormattingEdits(_document: vscode.TextDocument): vscode.TextEdit[] {
      const formatterPath = configuration.get<string | undefined>("ocamlformat");
      const formatter = formatterPath ? path.resolve(rootPath, formatterPath) : "ocamlformat";
      const textEditor = vscode.window.activeTextEditor;

      if (textEditor) {
        const text = textEditor.document.getText();
        const filePath = textEditor.document.fileName;
        const formattedText = execSync(`cd ${rootPath} && ${formatter} --name=${filePath} /dev/stdin <<<'${text}'`, {
          cwd: rootPath,
        }).toString();
        const textRange = getFullTextRange(textEditor);

        return [vscode.TextEdit.replace(textRange, formattedText)];
      } else {
        return [];
      }
    },
  });
}

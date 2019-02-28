import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
import * as vscode from "vscode";
import { getFullTextRange } from "./utils";

export function register() {
  const configuration = vscode.workspace.getConfiguration("reason");
  const rootPath = vscode.workspace.rootPath || "";

  vscode.languages.registerDocumentFormattingEditProvider(
    { scheme: "file", language: "ocaml" },
    {
      provideDocumentFormattingEdits(_document: vscode.TextDocument): vscode.TextEdit[] {
        const formatterPath = configuration.get<string | undefined>("path.ocamlformat");
        const formatter = formatterPath ? path.resolve(rootPath, formatterPath) : "ocamlformat";
        const textEditor = vscode.window.activeTextEditor;

        if (textEditor) {
          const tempFileName = `/tmp/vscode-reasonml-${uuidv4()}.ml`;
          fs.writeFileSync(tempFileName, textEditor.document.getText(), "utf8");
          const filePath = textEditor.document.fileName;
          const formattedText = execSync(
            `cd ${rootPath} && ${formatter} --name=${filePath} ${tempFileName}`,
          ).toString();
          fs.unlinkSync(tempFileName);

          const textRange = getFullTextRange(textEditor);
          return [vscode.TextEdit.replace(textRange, formattedText)];
        } else {
          return [];
        }
      },
    },
  );
}

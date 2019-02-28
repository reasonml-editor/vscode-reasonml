import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";
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
        const tempFileName = `/tmp/vscode-refmt-${uuidv4()}`;
        fs.writeFileSync(tempFileName, textEditor.document.getText(), "utf8");
        const formattedText = execSync(`${formatter} ${tempFileName}`).toString();
        const textRange = getFullTextRange(textEditor);
        fs.unlinkSync(tempFileName);

        return [vscode.TextEdit.replace(textRange, formattedText)];
      } else {
        return [];
      }
    },
  });
}

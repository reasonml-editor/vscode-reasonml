import { execSync } from "child_process";
import * as fs from "fs";
import { v4 as uuidv4 } from "uuid";
import * as vscode from "vscode";
import { getFormatter, getFullTextRange } from "./utils";

export function register() {
  const configuration = vscode.workspace.getConfiguration("reason");

  vscode.languages.registerDocumentFormattingEditProvider(
    { scheme: "file", language: "reason" },
    {
      provideDocumentFormattingEdits(_document: vscode.TextDocument): vscode.TextEdit[] {
        const textEditor = vscode.window.activeTextEditor;
        const formatter = getFormatter(configuration, "refmt");

        if (!formatter) return [];

        if (textEditor) {
          const tempFileName = `/tmp/vscode-refmt-${uuidv4()}.re`;
          fs.writeFileSync(tempFileName, textEditor.document.getText(), "utf8");
          try {
            const formattedText = execSync(`${formatter} ${tempFileName}`).toString();
            const textRange = getFullTextRange(textEditor);
            fs.unlinkSync(tempFileName);
            return [vscode.TextEdit.replace(textRange, formattedText)];
          } catch (e) {
            fs.unlinkSync(tempFileName);
            return [];
          }
        } else {
          return [];
        }
      },
    },
  );
}

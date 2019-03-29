import { execSync } from "child_process";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
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
          const tempFileName = path.join(os.tmpdir(), `vscode-reasonml-refmt-${uuidv4()}.ml`);
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

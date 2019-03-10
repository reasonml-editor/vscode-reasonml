import { execSync } from "child_process";
import * as path from "path";
import * as vscode from "vscode";

export function getFullTextRange(textEditor: vscode.TextEditor) {
  const firstLine = textEditor.document.lineAt(0);
  const lastLine = textEditor.document.lineAt(textEditor.document.lineCount - 1);

  return new vscode.Range(
    0,
    firstLine.range.start.character,
    textEditor.document.lineCount - 1,
    lastLine.range.end.character,
  );
}

function getExecutablePath(executable: string) {
  try {
    return execSync(`which ${executable}`).toString();
  } catch (_e) {
    return null;
  }
}

export function getFormatter(configuration: vscode.WorkspaceConfiguration, formatterName: string) {
  const rootPath = vscode.workspace.rootPath || "";
  const formatterPath = configuration.get<string | undefined>(`path.${formatterName}`) || formatterName;

  const formatter =
    formatterPath === formatterName ? getExecutablePath(formatterName) : path.resolve(rootPath, formatterPath);

  if (!formatter) {
    vscode.window.showInformationMessage(
      `${formatterPath} is not available. Please specify "vscode-reasonml.path.${formatterName}"`,
    );
  }

  return formatter;
}

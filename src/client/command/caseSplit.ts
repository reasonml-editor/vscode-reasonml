import * as merlin from "../../shared/merlin";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";
import * as types from "vscode-languageserver-types";

export function execute(editor: vscode.TextEditor, destruct: merlin.data.Case.Destruct): void {
  const [{ end, start }, content] = destruct;
  editor.edit((editBuilder) => {
    const range = new vscode.Range(
      new vscode.Position(start.line - 1, start.col),
      new vscode.Position(end.line - 1, end.col),
    );
    const cases = format(editor, content);
    editBuilder.replace(range, cases);
  });
}

export function format(editor: vscode.TextEditor, content: string): string {
  const line = editor.document.lineAt(editor.selection.start);
  const match = line.text.match(/^\s*/);
  const indentation = match && match.length > 0 ? match[0] : ""; // FIXME: use use indentation settings
  let result = content;
  result = format.deleteTrailingWhitespace(result);
  result = format.deleteParentheses(result);
  result = format.indentSwitchExpression(indentation, result);
  result = format.indentRecordPatterns(result);
  result = format.insertPlaceholders(result);
  return result;
}

export namespace format {
  export function insertPlaceholders(content: string): string {
    return content.replace(/\(\?\?\)/g, `failwith "<case>"`);
  }
  export function indentSwitchExpression(indentation: string, content: string): string {
    return !/^\bswitch\b/g.test(content)
      ? content
      : content
        .replace(/\|/g, `${indentation}  |`)
        .replace(/}$/g, `${indentation}}`);
  }
  export function indentRecordPatterns(content: string): string {
    return content.replace(/{(?!\s)/g, "{ ").replace(/([^\s])}/g, "$1 }");
  }
  export function deleteParentheses(content: string): string {
    return content.replace(/^\(|\n\)$/g, "");
  }
  export function deleteTrailingWhitespace(content: string): string {
    return content.replace(/\n$/, "");
  }
}

export function register(context: vscode.ExtensionContext, reasonClient: client.LanguageClient): void {
  context.subscriptions.push(vscode.commands.registerCommand("reasonml.caseSplit", async () => {
    const editor = vscode.window.activeTextEditor;
    const textDocument = { uri: editor.document.uri.toString() };
    if (editor.selection.isEmpty) {
      await vscode.commands.executeCommand("expand_region");
    }
    const range = types.Range.create(
      editor.selection.start.line, editor.selection.start.character,
      editor.selection.end.line, editor.selection.end.character,
    );
    const method = "caseAnalysis";
    try {
      const response = await reasonClient.sendRequest<
        { range: types.Range, textDocument: { uri: string } }, merlin.data.Case.Destruct, void
        >({ method }, { range, textDocument });
      execute(editor, response);
    } catch (err) {
      // vscode.window.showErrorMessage(JSON.stringify(err));
    }
  }));
}

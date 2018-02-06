import { merlin, remote } from "ocaml-language-server";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";
import * as LSP from "vscode-languageserver-protocol";

async function execute(editor: vscode.TextEditor, destruct: merlin.Case.Destruct): Promise<boolean> {
  const [{ end, start }, content] = destruct;
  return editor.edit(editBuilder => {
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
  result = format.deleteWhitespace(result);
  result = format.deleteParentheses(result);
  result = format.indentExpression(indentation, result);
  result = format.indentPatterns(result);
  result = format.insertPlaceholders(result);
  return result;
}

export namespace format {
  export function deleteParentheses(content: string): string {
    return content.replace(/^\(|\n\)$/g, "");
  }
  export function deleteWhitespace(content: string): string {
    return content.replace(/\n$/, "");
  }
  export function indentExpression(indentation: string, content: string): string {
    return !/^\bswitch\b/g.test(content)
      ? content
      : content.replace(/\|/g, `${indentation}|`).replace(/}$/g, `${indentation}}`);
  }
  export function indentPatterns(content: string): string {
    return content.replace(/{(?!\s)/g, "{ ").replace(/([^\s])}/g, "$1 }");
  }
  export function insertPlaceholders(content: string): string {
    return content.replace(/\(\?\?\)/g, `failwith "<case>"`);
  }
}

export function register(context: vscode.ExtensionContext, languageClient: client.LanguageClient): void {
  // FIXME: using the edit builder passed in to the command doesn't seem to work
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand("reason.caseSplit", async (editor): Promise<void> => {
      const textDocument = { uri: editor.document.uri.toString() };
      const rangeCode = editor.document.getWordRangeAtPosition(editor.selection.start);
      if (null == rangeCode) return;
      const range = LSP.Range.create(rangeCode.start, rangeCode.end);
      const params = { range, textDocument };
      try {
        const response = await languageClient.sendRequest(remote.server.giveCaseAnalysis, params);
        if (null != response) await execute(editor, response);
      } catch (err) {
        // FIXME: clean this up
        // vscode.window.showErrorMessage(JSON.stringify(err));
        const pattern = /Destruct not allowed on non-immediate type/;
        if (pattern.test(err)) {
          vscode.window.showWarningMessage(
            "More type info needed for case split; try adding an annotation somewhere, e.g., (pattern: type).",
          );
        }
      }
    }),
  );
}

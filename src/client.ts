import * as merlin from "./merlin";
import * as path from "path";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";
import * as types from "vscode-languageserver-types";

namespace Operation {
  export async function caseSplit(editor: vscode.TextEditor, destruct: merlin.Case.Destruct): Promise<void> {
    const [{ end, start }, content] = destruct;
    editor.edit((editBuilder) => {
      const range = new vscode.Range(
        new vscode.Position(start.line - 1, start.col),
        new vscode.Position(end.line - 1, end.col)
      );
      const line = editor.document.lineAt(editor.selection.start);
      const match = line.text.match(/^\s*/);
      const indentation = `${match && match.length > 0 ? match[0] : ""}`; // FIXME: use use indentation settings
      let cases = content;
      cases = cases.replace(/\n$/, "");
      cases = cases.replace(/^\(|\n\)$/g, "");
      cases = /\bswitch\b/g.test(cases)
        ? cases
          .replace(/\|/g, `${indentation}  |`)
          .replace(/}$/g, `${indentation}}`)
        : cases;
      cases = cases.replace(/\(\?\?\)/g, `failwith "<case>"`);
      editBuilder.replace(range, cases);
    });
  }
}

export function launch(context: vscode.ExtensionContext): vscode.Disposable {
  const module = context.asAbsolutePath(path.join("out", "src", "server.js"));
  const transport = client.TransportKind.ipc;
  let options: client.ForkOptions;

  options = {};
  const run = { module, transport, options };

  options = { execArgv: [ "--nolazy", "--debug=6004" ] };
  const debug = { module, transport, options };

  const serverOptions = { run, debug };
  const clientOptions = { documentSelector: [ "reason.module.defns", "reason.module.decls" ] };
  const reasonClient = new client.LanguageClient("Reason", serverOptions, clientOptions);

  reasonClient.onRequest<
    client.TextDocumentPositionParams,
    string | undefined,
    void
  >({ method: "getText" }, async (event) => {
    const range = new vscode.Range(
      new vscode.Position(event.position.line, 0),
      new vscode.Position(event.position.line, event.position.character));
    const document = await
      vscode.workspace.openTextDocument(vscode.Uri.parse(event.textDocument.uri));
    const pattern = /[A-Za-z_][A-Za-z_'0-9]*(?:\.[A-Za-z_][A-Za-z_'0-9]*)*\.?$/;
    const match = pattern.exec(document.getText(range));
    return match[0] ? match[0] : undefined;
  });

  context.subscriptions.push(vscode.commands.registerCommand("reasonml.caseSplit", async () => {
    const editor = vscode.window.activeTextEditor;
    const textDocument = { uri: editor.document.uri.toString() };
    if (editor.selection.isEmpty) {
      await vscode.commands.executeCommand("expand_region");
    }
    const range = types.Range.create(
      editor.selection.start.line, editor.selection.start.character,
      editor.selection.end  .line, editor.selection.end.character
    );
    const method = "caseAnalysis";
    try {
      const response = await reasonClient.sendRequest<
        { range: types.Range, textDocument: { uri: string }}, merlin.Case.Destruct, void
      >({ method }, { range, textDocument });
      Operation.caseSplit(editor, response);
    } catch (err) {
      // vscode.window.showErrorMessage(JSON.stringify(err));
    }
  }));

  return reasonClient.start();
}

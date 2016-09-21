import * as path from 'path';
import * as vscode from 'vscode';
import * as client from 'vscode-languageclient';

export function launch(context: vscode.ExtensionContext): vscode.Disposable {
  const module = context.asAbsolutePath(path.join('out', 'src', 'server.js'));
  const transport = client.TransportKind.ipc;
  let options: client.ForkOptions;

  options = {};
  const run = { module, transport, options };

  options = { execArgv: [ "--nolazy", "--debug=6004" ] };
  const debug = { module, transport, options };

  const serverOptions = { run, debug };
  const clientOptions = { documentSelector: [ 'reason', 'reason-interface' ] };
  const reasonClient = new client.LanguageClient('Reason', serverOptions, clientOptions);

  reasonClient.onRequest<client.TextDocumentPositionParams, string | undefined, void>({ method: 'getText' }, async (data) => {
    const range = new vscode.Range(
      new vscode.Position(data.position.line, 0),
      new vscode.Position(data.position.line, data.position.character));
    const document = await
      vscode.workspace.openTextDocument(vscode.Uri.parse(data.textDocument.uri));
    const pattern = /[A-Za-z_][A-Za-z_'0-9]*(?:\.[A-Za-z_][A-Za-z_'0-9]*)*\.?$/;
    const match = pattern.exec(document.getText(range));
    return match ? match[0] : undefined;
  });

  return reasonClient.start();
}

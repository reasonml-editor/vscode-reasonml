import * as path from 'path';
import * as vscode from 'vscode';
import * as client from 'vscode-languageclient';

export function launch(context: vscode.ExtensionContext): vscode.Disposable {
  let serverModule = context.asAbsolutePath(path.join('out', 'src', 'server.js'));
  let debugOptions = {
    execArgv: [
      "--nolazy",
      "--debug=6004",
    ],
  };
  let serverOptions: client.ServerOptions = {
    run: {
      module: serverModule,
      transport: client.TransportKind.ipc,
    },
    debug: {
      module: serverModule,
      transport: client.TransportKind.ipc,
      options: debugOptions,
    },
  };
  let clientOptions: client.LanguageClientOptions = {
    documentSelector: [ 'reason', 'reason-interface' ],
  };
  let disposable = new client.LanguageClient(
    'Reason',
    serverOptions,
    clientOptions,
  ).start();
  console.log('client::start()');
  return disposable;
}

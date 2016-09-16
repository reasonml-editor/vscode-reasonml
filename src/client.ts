import * as path from 'path';
import * as vscode from 'vscode';
import * as client from 'vscode-languageclient';

export function launch(context: vscode.ExtensionContext): vscode.Disposable {
  const serverModule = context.asAbsolutePath(path.join('out', 'src', 'server.js'));
  const debugOptions = {
    execArgv: [ "--nolazy", "--debug=6004" ],
  };
  const serverOptions: client.ServerOptions = {
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
  const clientOptions: client.LanguageClientOptions = {
    documentSelector: [ 'reason', 'reason-interface' ],
  };
  return new client.LanguageClient('Reason', serverOptions, clientOptions).start();
}

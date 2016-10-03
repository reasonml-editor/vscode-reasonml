import * as command from "./command";
import * as path from "path";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";

export function launch(context: vscode.ExtensionContext): vscode.Disposable {
  const module = context.asAbsolutePath(path.join("out", "src", "server", "index.js"));
  const transport = client.TransportKind.ipc;
  const run = { module, transport, options: {} };
  const debug = { module, transport, options: { execArgv: [ "--nolazy", "--debug=6004" ] } };
  const serverOptions = { run, debug };
  const clientOptions = { documentSelector: [ "reason" ] };
  const languageClient = new client.LanguageClient("Reason", serverOptions, clientOptions);
  command.registerAll(context, languageClient);
  return languageClient.start();
}

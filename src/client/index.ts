import * as command from "./command";
import * as request from "./request";
import * as path from "path";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";

class ClientWindow implements vscode.Disposable {
  readonly merlin: vscode.StatusBarItem;
  constructor() {
    this.merlin = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
    this.merlin.text = "$(hubot) [merlin]";
    this.merlin.command = "reason.showMerlinFiles";
    this.merlin.show();
    return this;
  }
  dispose() {
    this.merlin.dispose();
  }
}

export function launch(context: vscode.ExtensionContext): vscode.Disposable {
  const module = context.asAbsolutePath(path.join("out", "src", "server", "index.js"));
  const transport = client.TransportKind.ipc;
  const run = { module, transport, options: {} };
  const debug = { module, transport, options: { execArgv: [ "--nolazy", "--debug=6004" ] } };
  const serverOptions = { run, debug };
  const clientOptions = { documentSelector: [ "reason" ] };
  const languageClient = new client.LanguageClient("Reason", serverOptions, clientOptions);
  command.registerAll(context, languageClient);
  request.registerAll(context, languageClient);
  context.subscriptions.push(new ClientWindow());
  return languageClient.start();
}

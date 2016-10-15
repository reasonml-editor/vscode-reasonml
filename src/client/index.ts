import * as command from "./command";
import * as request from "./request";
import * as path from "path";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";

class ClientWindow implements vscode.Disposable {
  readonly merlin: vscode.StatusBarItem;
  constructor() {
    this.merlin = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
    this.merlin.text = "$(hubot) [loading]";
    this.merlin.command = "reason.showMerlinFiles";
    this.merlin.show();
    return this;
  }
  dispose() {
    this.merlin.dispose();
  }
}

export async function launch(context: vscode.ExtensionContext): Promise<void> {
  const reasonConfig = vscode.workspace.getConfiguration("reason");
  const module = context.asAbsolutePath(path.join("out", "src", "server", "index.js"));
  const transport = client.TransportKind.ipc;
  const run = { module, transport, options: {} };
  const debug = { module, transport, options: { execArgv: [ "--nolazy", "--debug=6004" ] } };
  const serverOptions = { run, debug };
  const clientOptions: client.LanguageClientOptions = {
    diagnosticCollectionName: "Reason",
    documentSelector: reasonConfig.get<string[]>("server.languages", [ "reason" ]),
    outputChannelName: "Reason",
    stdioEncoding: "utf8",
    synchronize: {
      configurationSection: "reason",
      fileEvents: vscode.workspace.createFileSystemWatcher("**/.merlin"),
    },
  };
  const languageClient = new client.LanguageClient("Reason", serverOptions, clientOptions);
  command.registerAll(context, languageClient);
  request.registerAll(context, languageClient);
  const window = new ClientWindow();
  const session = languageClient.start();
  context.subscriptions.push(window);
  context.subscriptions.push(session);
  await languageClient.onReady();
  window.merlin.text = "$(hubot) [merlin]";
  window.merlin.tooltip = "merlin server online";
}

import * as path from "path";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";
import * as command from "./command";
import * as request from "./request";

class ClientWindow implements vscode.Disposable {
  public readonly merlin: vscode.StatusBarItem;
  constructor() {
    this.merlin = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 0);
    this.merlin.text = "$(hubot) [loading]";
    this.merlin.command = "reason.showMerlinFiles";
    this.merlin.show();
    return this;
  }
  public dispose() {
    this.merlin.dispose();
  }
}

class ErrorHandler {
  public closed(): client.CloseAction {
    return client.CloseAction.DoNotRestart;
  }
  public error(): client.ErrorAction {
    return client.ErrorAction.Shutdown;
  }
}

export async function launch(context: vscode.ExtensionContext): Promise<void> {
  const reasonConfig = vscode.workspace.getConfiguration("reason");
  const module = context.asAbsolutePath(path.join("node_modules", "ocaml-language-server"));
  const transport = client.TransportKind.ipc;
  const run = { module, transport, args: ["--node-ipc"], options: {} };
  const debug = { module, transport, args: ["--node-ipc"], options: { execArgv: [ "--nolazy", "--debug=6004" ] } };
  const serverOptions = { run, debug };
  const clientOptions: client.LanguageClientOptions = {
    diagnosticCollectionName: "Reason",
    documentSelector: reasonConfig.get<string[]>("server.languages", [ "reason" ]),
    errorHandler: new ErrorHandler(),
    initializationOptions: reasonConfig,
    outputChannelName: "Reason",
    stdioEncoding: "utf8",
    synchronize: {
      configurationSection: "reason",
      fileEvents: [
        vscode.workspace.createFileSystemWatcher("**/.merlin"),
        vscode.workspace.createFileSystemWatcher("**/*.ml"),
        vscode.workspace.createFileSystemWatcher("**/*.re"),
      ],
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

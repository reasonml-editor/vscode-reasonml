import flatMap = require("lodash.flatmap");
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
  const module = context.asAbsolutePath(path.join("node_modules", "ocaml-language-server", "bin", "server"));
  const options = { execArgv: ["--nolazy", "--inspect=6009"] };
  const transport = client.TransportKind.ipc;
  const run = { module, transport };
  const debug = {
    module,
    options,
    transport,
  };
  const serverOptions = { run, debug };
  const languages = reasonConfig.get<string[]>("server.languages", ["ocaml", "reason"]);
  const documentSelector = flatMap(languages, (language: string) => [
    { language, scheme: "file" },
    { language, scheme: "untitled" },
  ]);

  const clientOptions: client.LanguageClientOptions = {
    diagnosticCollectionName: "ocaml-language-server",
    documentSelector,
    errorHandler: new ErrorHandler(),
    initializationOptions: reasonConfig,
    outputChannelName: "OCaml Language Server",
    stdioEncoding: "utf8",
    synchronize: {
      configurationSection: "reason",
      fileEvents: [
        vscode.workspace.createFileSystemWatcher("**/.merlin"),
        vscode.workspace.createFileSystemWatcher("**/*.ml"),
        vscode.workspace.createFileSystemWatcher("**/*.re"),
        vscode.workspace.createFileSystemWatcher("**/command-exec"),
        vscode.workspace.createFileSystemWatcher("**/command-exec.bat"),
        vscode.workspace.createFileSystemWatcher("**/_build"),
        vscode.workspace.createFileSystemWatcher("**/_build/*"),
      ],
    },
  };
  const languageClient = new client.LanguageClient("Reason", serverOptions, clientOptions);
  const window = new ClientWindow();
  const session = languageClient.start();
  context.subscriptions.push(window);
  context.subscriptions.push(session);
  await languageClient.onReady();
  command.registerAll(context, languageClient);
  request.registerAll(context, languageClient);
  window.merlin.text = "$(hubot) [merlin]";
  window.merlin.tooltip = "merlin server online";
}

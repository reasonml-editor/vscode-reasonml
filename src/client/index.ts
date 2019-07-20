import flatMap = require("lodash.flatmap");
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
  return launchMerlinLsp(context);
}

function getMerlinLspOptions(lsp: string) {
  let run = {
    args: [],
    command: lsp,
    options: {
      env: {
        ...process.env,
        MERLIN_LOG: "-",
        OCAMLFIND_CONF: "/dev/null",
        OCAMLRUNPARAM: "b",
      },
    },
  };

  return {
    debug: run,
    run: run,
  };
}

export async function launchMerlinLsp(context: vscode.ExtensionContext): Promise<void> {
  const reasonConfig = vscode.workspace.getConfiguration("reason");
  const lsp = reasonConfig.get<string | undefined>(`path.ocamlmerlin-lsp`);

  if (!lsp) {
    vscode.window.showInformationMessage("reason.path.ocamlmerlin-lsp is not specified");
    return;
  }

  const serverOptions = getMerlinLspOptions(lsp);
  const languages = reasonConfig.get<string[]>("server.languages", ["ocaml", "reason"]);
  const documentSelector = flatMap(languages, (language: string) => [
    { language, scheme: "file" },
    { language, scheme: "untitled" },
  ]);
  const clientOptions: client.LanguageClientOptions = {
    diagnosticCollectionName: "ocamlmerlin-lsp",
    documentSelector,
    errorHandler: new ErrorHandler(),
    initializationOptions: reasonConfig,
    outputChannelName: "Merlin Language Server",
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

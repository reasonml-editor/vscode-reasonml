import flatMap = require("lodash.flatmap");
import * as path from "path";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";
import { getEsyConfig, isBucklescriptProject } from "../utils";
import * as command from "./command";
import * as request from "./request";

const isWin = process.platform === "win32";

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

function isEsyConfiguredProperly(esyConfig: any) {
  const requiredDependencies = ["ocaml", "@opam/merlin-lsp"];

  if (!esyConfig) {
    vscode.window.showInformationMessage("LSP is unable to start. Couldn't find esy configuration");
    return false;
  }

  return requiredDependencies.every(dependency => {
    if (!esyConfig.devDependencies[dependency]) {
      vscode.window.showInformationMessage(`LSP is unable to start. Add "${dependency}" to your devDependencies`);
      return false;
    }

    return true;
  });
}

function isConfuguredProperly(esyConfig: any) {
  if (esyConfig) {
    return isEsyConfiguredProperly(esyConfig);
  }

  if (isBucklescriptProject()) return true;

  vscode.window.showInformationMessage(
    "LSP is unable to start. Extension couldn't detect type of the project. Provide esy or bucklescript configuration. More in README.",
  );
  return false;
}

export async function launch(context: vscode.ExtensionContext): Promise<void> {
  const esyConfig = await getEsyConfig();

  if (!isConfuguredProperly(esyConfig)) return;

  return launchMerlinLsp(context, {
    useEsy: !!esyConfig,
  });
}

function getPrebuiltExecutablesPath() {
  return path.join(__dirname, `../../../executables/${process.platform}`);
}

function getMerlinLspPath(useEsy: boolean) {
  let merlinLspPath = isWin ? "ocamlmerlin-lsp.exe" : "ocamlmerlin-lsp";

  if (!useEsy) {
    merlinLspPath = path.join(getPrebuiltExecutablesPath(), merlinLspPath);
  }

  return merlinLspPath;
}

function getMerlinLspOptions(options: { useEsy: boolean }) {
  const merlinLsp = getMerlinLspPath(options.useEsy);
  const pth = options.useEsy ? process.env.PATH : `${getPrebuiltExecutablesPath()}:${process.env.PATH}`;

  let run;
  if (options.useEsy) {
    run = {
      args: ["exec-command", "--include-current-env", merlinLsp],
      command: process.platform === "win32" ? "esy.cmd" : "esy",
    };
  } else {
    run = {
      args: [],
      command: merlinLsp,
    };
  }

  const serverOptions: client.ServerOptions = {
    debug: {
      ...run,
      options: {
        env: {
          ...process.env,
          MERLIN_LOG: "-",
          OCAMLFIND_CONF: "/dev/null",
          OCAMLRUNPARAM: "b",
          PATH: pth,
        },
      },
    },
    run: {
      ...run,
      options: {
        env: {
          ...process.env,
          MERLIN_LOG: "-",
          OCAMLFIND_CONF: "/dev/null",
          OCAMLRUNPARAM: "b",
          PATH: pth,
        },
      },
    },
  };
  return serverOptions;
}

export async function launchMerlinLsp(context: vscode.ExtensionContext, options: { useEsy: boolean }): Promise<void> {
  const serverOptions = getMerlinLspOptions(options);
  const reasonConfig = vscode.workspace.getConfiguration("reason");

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

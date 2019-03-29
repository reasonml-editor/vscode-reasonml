import * as fs from "fs";
import flatMap = require("lodash.flatmap");
import * as path from "path";
import { promisify } from "util";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";
import * as command from "./command";
import * as request from "./request";

const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);

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

async function isEsyProject() {
  const reasonConfig = vscode.workspace.getConfiguration("reason");
  const forceEsy = reasonConfig.get<boolean>("forceEsy", false);
  if (forceEsy) {
    return true;
  }

  // TODO: we need to use workspace.workspaceFolders here and run LSP server per
  // root. For now we'll just run LSP per workspace.
  const root = vscode.workspace.rootPath;
  if (root == null) {
    return false;
  }

  const esyJson = path.join(root, "esy.json");
  const packageJson = path.join(root, "package.json");
  if (await exists(esyJson)) {
    return true;
  } else if (await exists(packageJson)) {
    // package.json could be unrelated to esy, check if it has "esy" config
    // then.
    try {
      const data = await readFile(packageJson, "utf8");
      const json = JSON.parse(data);
      return json.esy != null;
    } catch (_e) {
      return false;
    }
  }

  return false;
}

async function isBSProject() {
  // TODO: we need to use workspace.workspaceFolders here and run LSP server per
  // root. For now we'll just run LSP per workspace.
  const root = vscode.workspace.rootPath;
  if (root == null) {
    return false;
  }

  const bsconfigJson = path.join(root, "bsconfig.json");

  if (await exists(bsconfigJson)) {
    return true;
  }

  return false;
}

export async function launch(context: vscode.ExtensionContext): Promise<void> {
  const isEasyProject = await isEsyProject();
  const isBucklescriptProject = await isBSProject();
  return launchMerlinLsp(context, {
    isBucklescriptProject,
    useEsy: isEasyProject,
  });
}

function getPrebuiltExecutablesPath() {
  return path.join(__dirname, `../../../executables/${process.platform}`);
}

function getMerlinLspPath(isBucklescriptProject: boolean) {
  const reasonConfig = vscode.workspace.getConfiguration("reason");
  let merlinLspPath = reasonConfig.get<string | null>("path.ocamlmerlin-lsp", null);

  if (merlinLspPath == null) {
    merlinLspPath = isWin ? "ocamlmerlin-lsp.exe" : "ocamlmerlin-lsp";

    if (isBucklescriptProject) {
      merlinLspPath = path.join(getPrebuiltExecutablesPath(), merlinLspPath);
    }
  }

  return merlinLspPath;
}

function getMerlinReasonDir() {
  const reasonConfig = vscode.workspace.getConfiguration("reason");
  const merlinReasonPath = reasonConfig.get<string | null>("path.ocamlmerlin-reason", null);

  if (merlinReasonPath == null) return getPrebuiltExecutablesPath();

  return path.dirname(merlinReasonPath);
}

function getMerlinLspOptions(options: { useEsy: boolean; isBucklescriptProject: boolean }) {
  const merlinLsp = getMerlinLspPath(options.isBucklescriptProject);
  const merlinReasonDir = getMerlinReasonDir();

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
          OCAMLRUNPARAM: "b",
          PATH: merlinReasonDir,
        },
      },
    },
    run: {
      ...run,
      options: {
        env: {
          ...process.env,
          MERLIN_LOG: "-",
          OCAMLRUNPARAM: "b",
          PATH: merlinReasonDir,
        },
      },
    },
  };
  return serverOptions;
}

export async function launchMerlinLsp(
  context: vscode.ExtensionContext,
  options: { useEsy: boolean; isBucklescriptProject: boolean },
): Promise<void> {
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

// tslint:disable object-literal-sort-keys

import * as fs from "fs";
import * as path from "path";
import * as semver from "semver";
import * as vscode from "vscode";
import * as client from "./client";
import { register as registerOcamlForamtter } from "./formatters/ocaml";
import { register as registerReasonForamtter } from "./formatters/reason";
import { isBucklescriptProject } from "./utils";

const reasonConfiguration = {
  indentationRules: {
    decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/,
    increaseIndentPattern: /^.*\{[^}"']*$/,
  },
  onEnterRules: [
    {
      beforeText: /^.*\b(switch|try)\b[^\{]*{\s*$/,
      action: {
        indentAction: vscode.IndentAction.IndentOutdent,
        appendText: "| ",
      },
    },
    {
      beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
      afterText: /^\s*\*\/$/,
      action: {
        indentAction: vscode.IndentAction.IndentOutdent,
        appendText: " * ",
      },
    },
    {
      beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
      action: {
        indentAction: vscode.IndentAction.None,
        appendText: " * ",
      },
    },
    {
      beforeText: /^(\t|(\ \ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
      action: {
        indentAction: vscode.IndentAction.None,
        appendText: "* ",
      },
    },
    {
      beforeText: /^(\t|(\ \ ))*\ \*\/\s*$/,
      action: {
        indentAction: vscode.IndentAction.None,
        removeText: 1,
      },
    },
    {
      beforeText: /^(\t|(\ \ ))*\ \*[^/]*\*\/\s*$/,
      action: {
        indentAction: vscode.IndentAction.None,
        removeText: 1,
      },
    },
    {
      beforeText: /^.*\bfun\b\s*$/,
      action: {
        indentAction: vscode.IndentAction.None,
        appendText: "| ",
      },
    },
    {
      beforeText: /^\s*\btype\b.*=(.*[^;\\{<]\s*)?$/,
      afterText: /^\s*$/,
      action: {
        indentAction: vscode.IndentAction.None,
        appendText: "  | ",
      },
    },
    {
      beforeText: /^(\t|[ ]{2})*[\|]([^!$%&*+-/<=>?@^~;}])*(?:$|=>.*[^\s\{]\s*$)/m,
      action: {
        indentAction: vscode.IndentAction.None,
        appendText: "| ",
      },
    },
    {
      beforeText: /^(\t|(\ \ ))*\|(.*[;])$/,
      action: {
        indentAction: vscode.IndentAction.Outdent,
      },
    },
    {
      beforeText: /^(\t|(\ \ ))*;\s*$/,
      action: {
        indentAction: vscode.IndentAction.Outdent,
      },
    },
  ],
  wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\"\,\.\<\>\/\?\s]+)/g,
};

function getPackageJsonConfig() {
  const rootPath = vscode.workspace.rootPath;
  if (!rootPath) return;

  const packageJsonPath = path.join(rootPath, "package.json");

  try {
    const packageJsonString = fs.readFileSync(packageJsonPath, "utf-8");
    return JSON.parse(packageJsonString);
  } catch (_e) {
    return null;
  }
}

function generateEsyConfig() {
  const packageJsonConfig = getPackageJsonConfig();
  if (!packageJsonConfig) return null;

  const bsPlatformVersion = packageJsonConfig.devDependencies ? packageJsonConfig.devDependencies["bs-platform"] : null;

  if (!bsPlatformVersion) {
    // TODO: Show notification;
    return null;
  }

  const baseEsyConfig = {
    name: packageJsonConfig.name,
    version: packageJsonConfig.version,
    comments: [
      "This file is used to help esy install the required binaries for vscode-reasonml extension",
      "The `ocaml` package version will have to be updated if you change bs-platform in package.json to a version that",
      "depends on a different version of the OCaml compiler (for example, from 4.02 to 4.06).",
    ],
  };
  /* tslint:disable:object-literal-key-quotes */
  const esyConfig = semver.gtr("6.0.0", bsPlatformVersion)
    ? {
        ...baseEsyConfig,
        devDependencies: {
          "@opam/merlin-lsp": "*",
          ocaml: "4.2.x",
        },
        resolutions: {
          "@opam/ppx_deriving": {
            source: "github:ocaml-ppx/ppx_deriving:opam#71e61a2",
            override: {
              build: ["ocaml pkg/build.ml native=true native-dynlink=true"],
            },
          },
          "@opam/merlin-lsp": "github:Khady/merlin:merlin-lsp.opam#9325d1d",
        },
      }
    : {
        ...baseEsyConfig,
        devDependencies: {
          "@opam/merlin-lsp": "*",
          ocaml: "4.06.x",
        },
        resolutions: {
          "@opam/merlin-lsp": "github:ocaml/merlin:merlin-lsp.opam#517f577",
        },
      };
  /* tslint:disable:object-literal-key-quotes */
  return JSON.stringify(esyConfig, null, "  ");
}

export async function activate(context: vscode.ExtensionContext) {
  function start() {
    client.launch(context);
  }

  async function init() {
    if (!isBucklescriptProject) return;

    const rootPath = vscode.workspace.rootPath;
    if (!rootPath) return;

    const esyJsonPath = path.join(rootPath, "esy.json");
    const esyConfig = generateEsyConfig();
    if (!esyConfig) {
      vscode.window.showInformationMessage("bs-platform not found in devDependencies");
      return;
    }

    const choice = await vscode.window.showQuickPick(
      [
        {
          description: "An `esy.json` file will be created on the root of the project.",
          label: "Yes",
        },
        {
          description: "The extension will not provide any diagnostics without it.",
          label: "No",
        },
      ],
      { placeHolder: "`esy.json` was not found in the project. Do you want the extension to create one for you?" },
    );

    if (choice && choice.label === "Yes") {
      fs.writeFileSync(esyJsonPath, esyConfig);
      vscode.window.showQuickPick(
        [
          {
            description: "",
            label: "Ok",
          },
        ],
        { placeHolder: "All good. Now run `esy`" },
      );
    }
  }

  context.subscriptions.push(vscode.languages.setLanguageConfiguration("reason", reasonConfiguration));
  registerOcamlForamtter();
  registerReasonForamtter();

  vscode.commands.registerCommand("reason.restart", start);
  vscode.commands.registerCommand("reason.init", init);
  start();
}

export function deactivate() {
  return;
}

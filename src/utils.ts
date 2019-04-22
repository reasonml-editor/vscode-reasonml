import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import * as semver from "semver";
import { promisify } from "util";
import * as vscode from "vscode";

const exists = promisify(fs.exists);
const readFile = promisify(fs.readFile);

export async function isBucklescriptProject() {
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

export async function getEsyConfig() {
  const root = vscode.workspace.rootPath;
  if (root == null) {
    return false;
  }

  let configFile = path.join(root, "esy.json");
  const isConfigFileExists = await exists(configFile);
  if (!isConfigFileExists) {
    configFile = path.join(root, "package.json");
  }

  try {
    const data = await readFile(configFile, "utf8");
    const json = JSON.parse(data);
    return json.esy ? json : null;
  } catch (_e) {
    return null;
  }
}

export async function getOpamConfig() {
  const root = vscode.workspace.rootPath;
  if (root == null) {
    return false;
  }

  const configFile = path.join(root, "_opam");
  const isConfigFileExists = await exists(configFile);
  if (!isConfigFileExists) {
    return null;
  }
  return configFile;
}

export function getFullTextRange(textEditor: vscode.TextEditor) {
  const firstLine = textEditor.document.lineAt(0);
  const lastLine = textEditor.document.lineAt(textEditor.document.lineCount - 1);

  return new vscode.Range(
    0,
    firstLine.range.start.character,
    textEditor.document.lineCount - 1,
    lastLine.range.end.character,
  );
}

function getExecutablePath(executable: string) {
  try {
    return execSync(`which ${executable}`).toString();
  } catch (_e) {
    return null;
  }
}

export async function getFormatter(configuration: vscode.WorkspaceConfiguration, formatterName: string) {
  const rootPath = vscode.workspace.rootPath || "";
  const formatterPath = configuration.get<string | undefined>(`path.${formatterName}`) || formatterName;
  const esyConfig = await getEsyConfig();

  if (esyConfig) {
    if (!esyConfig.devDependencies[`@opam/${formatterName}`]) {
      vscode.window.showInformationMessage(
        `${formatterName} is unable to start. Specify "@opam/${formatterName}" in your devDependencies.`,
      );
      return null;
    }

    return `esy ${formatterName}`;
  }

  const formatter =
    formatterPath === formatterName ? getExecutablePath(formatterName) : path.resolve(rootPath, formatterPath);

  if (!formatter) {
    vscode.window.showInformationMessage(
      `${formatterPath} is not available. Please specify "reason.path.${formatterName}"`,
    );
  }

  return formatter;
}

function getPackageJsonConfig(rootPath: string) {
  const packageJsonPath = path.join(rootPath, "package.json");

  try {
    const packageJsonString = fs.readFileSync(packageJsonPath, "utf-8");
    return JSON.parse(packageJsonString);
  } catch (_e) {
    return null;
  }
}

export function generateEsyConfig(rootPath: string) {
  const packageJsonConfig = getPackageJsonConfig(rootPath);
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

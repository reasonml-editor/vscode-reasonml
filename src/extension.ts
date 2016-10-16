// tslint:disable object-literal-sort-keys

import * as client from "./client";
import * as vscode from "vscode";

const reasonConfiguration = {
  indentationRules: {
    decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/,
    increaseIndentPattern: /^.*\{[^}"']*$/,
  },
  onEnterRules: [
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
        appendText: "  | ",
      }
    },
    {
      beforeText: /^\s*\btype\b.*=(.*[^;\\{<]\s*)?$/,
      action: {
        indentAction: vscode.IndentAction.None,
        appendText: "  | ",
      }
    },
    {
      beforeText: /^(\t|(\ \ ))*(\|$)|(\|\s.*[^=][^>]\s*$)/,
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
  wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
};

export async function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(vscode.languages.setLanguageConfiguration("reason", reasonConfiguration));
  await client.launch(context);
}

export function deactivate() {
  return;
}

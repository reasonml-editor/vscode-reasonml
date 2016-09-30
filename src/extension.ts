import * as client from "./client";
import * as vscode from "vscode";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.setLanguageConfiguration("reason", {
      indentationRules: {
        decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/,
        increaseIndentPattern: /^.*\{[^}"']*$/,
      },
      onEnterRules: [
        {
          action: {
            appendText: " * ",
            indentAction: vscode.IndentAction.IndentOutdent,
          },
          afterText: /^\s*\*\/$/,
          beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
        },
        {
          action: {
            appendText: " * ",
            indentAction: vscode.IndentAction.None,
          },
          beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
        },
        {
          action: {
            appendText: "* ",
            indentAction: vscode.IndentAction.None,
          },
          beforeText: /^(\t|(\ \ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
        },
        {
          action: {
            indentAction: vscode.IndentAction.None,
            removeText: 1,
          },
          beforeText: /^(\t|(\ \ ))*\ \*\/\s*$/,
        },
        {
          action: { indentAction: vscode.IndentAction.None, removeText: 1 },
          beforeText: /^(\t|(\ \ ))*\ \*[^/]*\*\/\s*$/,
        },
      ],
      wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
    }));
  context.subscriptions.push(client.launch(context));
}

export function deactivate() {
  return;
}

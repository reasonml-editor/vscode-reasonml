import * as vscode from 'vscode';
import * as client from './client';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.languages.setLanguageConfiguration('reason', {
      indentationRules: {
        decreaseIndentPattern: /^(.*\*\/)?\s*\}.*$/,
        increaseIndentPattern: /^.*\{[^}"']*$/,
      },
      onEnterRules: [
        {
          beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
          afterText: /^\s*\*\/$/,
          action: { indentAction: vscode.IndentAction.IndentOutdent, appendText: ' * ' }
        },
        {
          beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
          action: { indentAction: vscode.IndentAction.None, appendText: ' * ' }
        },
        {
          beforeText: /^(\t|(\ \ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
          action: { indentAction: vscode.IndentAction.None, appendText: '* ' }
        },
        {
          beforeText: /^(\t|(\ \ ))*\ \*\/\s*$/,
          action: { indentAction: vscode.IndentAction.None, removeText: 1 }
        },
        {
          beforeText: /^(\t|(\ \ ))*\ \*[^/]*\*\/\s*$/,
          action: { indentAction: vscode.IndentAction.None, removeText: 1 }
        }
      ],
      wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
    }));
  context.subscriptions.push(client.launch(context));
}

export function deactivate() {
}

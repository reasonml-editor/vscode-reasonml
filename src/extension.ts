import * as vscode from 'vscode';
import * as client from './client';

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(client.launch(context));
}

export function deactivate() {
}

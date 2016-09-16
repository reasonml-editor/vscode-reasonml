import * as vscode from 'vscode';
import * as client from './client';

export function activate(context: vscode.ExtensionContext) {
  console.log('client::activate()');
  let disposable = client.launch(context);
  context.subscriptions.push(disposable);
}

export function deactivate() {
}

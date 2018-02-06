import { remote } from "ocaml-language-server";
import * as vscode from "vscode";
import * as client from "vscode-languageclient";
import * as LSP from "vscode-languageserver-protocol";

const SHOW_ALL_STR = "Show Entire Environment";
export function register(context: vscode.ExtensionContext, languageClient: client.LanguageClient): void {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand("reason.showProjectEnv", async editor => {
      const docURI: LSP.TextDocumentIdentifier = {
        uri: editor.document.uri.toString(),
      };
      const projectEnv: string[] = await languageClient.sendRequest(remote.server.giveProjectEnv, docURI);
      const projectEnvWithAll = [SHOW_ALL_STR].concat(projectEnv);
      const selected = await vscode.window.showQuickPick(projectEnvWithAll);
      if (null == selected) return;
      const content = selected === SHOW_ALL_STR ? projectEnv.join("\n") : selected;
      const textDocument = await vscode.workspace.openTextDocument({
        content,
        language: "shellscript",
      });
      await vscode.window.showTextDocument(textDocument);
    }),
  );
}

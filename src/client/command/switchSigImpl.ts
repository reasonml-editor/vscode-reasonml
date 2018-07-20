import * as fs from "fs";
import * as Path from "path";
import * as vscode from "vscode";

const fsWriteFile = (path: string, data: string) =>
  new Promise(resolve => {
    fs.writeFile(path, data, resolve);
  });

interface IExtToStringObj {
  [key: string]: string;
}

export function register(context: vscode.ExtensionContext): void {
  context.subscriptions.push(
    vscode.commands.registerTextEditorCommand("reason.switchSigImpl", async () => {
      const editor = vscode.window.activeTextEditor;
      const doc = editor != null ? editor.document : null;
      const path = doc != null ? doc.fileName : "";
      const ext = Path.extname(path || "");
      const extMatcher: IExtToStringObj = { ".mli": ".ml", ".ml": ".mli", ".re": ".rei", ".rei": ".re" };
      const newExt: string = extMatcher[ext];
      if (!newExt) {
        vscode.window.showInformationMessage("Target file must be a Reason or OCaml signature or implementation file");
        return;
      }
      const newPath = path.substring(0, path.length - ext.length) + newExt;
      fs.access(newPath, async err => {
        if (err) {
          const nameMatcher: IExtToStringObj = {
            ".ml": "Implementation",
            ".mli": "Signature",
            ".re": "Implementation",
            ".rei": "Signature",
          };
          const name = nameMatcher[newExt];
          const result = await vscode.window.showInformationMessage(`${name} file doesn't exist.`, "Create It");
          if (result === "Create It") {
            await fsWriteFile(newPath, "");
          } else {
            return;
          }
        }
        await vscode.commands.executeCommand("vscode.open", vscode.Uri.file(newPath));
      });
    }),
  );
}

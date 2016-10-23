import { types } from "../../shared";
import Session from "../session";
import * as server from "vscode-languageserver";

export default function(_: Session): server.RequestHandler<server.CodeActionParams, types.Command[], void> {
  return async ({ context, textDocument: { uri } }) => {
    const actions: types.Command[] = [];
    for (const { message, range } of context.diagnostics) {
      if (message === "Functions must be defined with => instead of the = symbol.") {
        const title = "fix: change = to =>";
        const command = "reason.codeAction.fixEqualsShouldBeArrow";
        const location = types.Location.create(uri, range);
        const args = [location];
        const action = types.Command.create(title, command, args);
        actions.push(action);
        continue;
      }
      if (message === "Statements must be terminated with a semicolon.") {
        const title = "fix: insert missing semicolon";
        const command = "reason.codeAction.fixMissingSemicolon";
        const location = types.Location.create(uri, range);
        const args = [location];
        const action = types.Command.create(title, command, args);
        actions.push(action);
        continue;
      }
    }
    return actions;
  };
}

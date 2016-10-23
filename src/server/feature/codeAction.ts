import { types } from "../../shared";
import Session from "../session";
import * as server from "vscode-languageserver";

export default function(_: Session): server.RequestHandler<server.CodeActionParams, types.Command[], void> {
  return async ({ context, textDocument: { uri } }) => {
    const actions: types.Command[] = [];
    let matches: null | RegExpMatchArray = null;
    for (const { message, range } of context.diagnostics) {
      if (message === "Functions must be defined with => instead of the = symbol.") {
        const title = "change = to =>";
        const command = "reason.codeAction.fixEqualsShouldBeArrow";
        const location = types.Location.create(uri, range);
        const args = [location];
        const action = types.Command.create(title, command, args);
        actions.push(action);
        continue;
      }
      if (message === "Statements must be terminated with a semicolon.") {
        const title = "insert missing semicolon";
        const command = "reason.codeAction.fixMissingSemicolon";
        const location = types.Location.create(uri, range);
        const args = [location];
        const action = types.Command.create(title, command, args);
        actions.push(action);
        continue;
      }
      if ((matches = message.match(/Warning (?:26|27): unused variable\s+\b(\w+)\b/)) != null) { // tslint:disable-line
        const title = "ignore unused variable";
        const command = "reason.codeAction.fixUnusedVariable";
        const location = types.Location.create(uri, range);
        const args = [location, matches[1]];
        const action = types.Command.create(title, command, args);
        actions.push(action);
        continue;
      }
    }
    return actions;
  };
}

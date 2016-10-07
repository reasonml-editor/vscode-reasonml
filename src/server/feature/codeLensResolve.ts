import * as types from "../../shared/types";
import * as method from "../method";
import { Session } from "../session";
import * as server from "vscode-languageserver";

export function handler(session: Session): server.RequestHandler<types.CodeLens, types.CodeLens, void> {
  return async (event, token) => {
    const data: types.SymbolInformation & { event: server.TextDocumentPositionParams } = event.data;
    const key = `${data.containerName}.${data.name}`;
    if (session.state.diagnostics === "dirty") {
      const title = session.state.codeLensesResolved.get(key);
      event.command = { command: "", title };
    } else {
      const itemType = await method.getType(session, data.event);
      if (token.isCancellationRequested) return event;
      if (itemType == null) return event;
      const title = itemType.type
        .replace(/=>/g, "⇒")
        .replace(/ : /g, ": ");
      event.command = { command: "", title };
      session.state.codeLensesResolved.set(key, title);
    }
    return event;
  };
}

import * as types from "../../shared/types";
import * as method from "../method";
import { Session } from "../session";
import * as server from "vscode-languageserver";

export function handler(session: Session): server.RequestHandler<types.CodeLens, types.CodeLens, void> {
  return async (event, token) => {
    const data: types.SymbolInformation & { event: server.TextDocumentPositionParams } = event.data;
    const itemType = await method.getType(session, data.event);
    if (token.isCancellationRequested) return event;
    if (itemType == null) return event;
    const command = "";
    const title = itemType.type
      .replace(/=>/g, "⇒")
      .replace(/ : /g, ": ");
    event.command = { command, title };
    return event;
  };
}

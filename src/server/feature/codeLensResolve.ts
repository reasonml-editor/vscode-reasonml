import { types } from "../../shared";
import * as command from "../command";
import Session from "../session";
import * as server from "vscode-languageserver";

export default function(session: Session): server.RequestHandler<types.CodeLens, types.CodeLens, void> {
  return async (event, token) => {
    const data: types.SymbolInformation & { event: server.TextDocumentPositionParams } = event.data;
    const itemType = await command.getType(session, data.event);
    if (token.isCancellationRequested) return event;
    if (itemType == null) return event;
    let title = itemType.type;
    if (session.settings.reason.codelens.unicode) {
      if (/\.ml$/.test(data.event.textDocument.uri)) {
        title = title.replace(/->/g, "→");
      }
      if (/\.re$/.test(data.event.textDocument.uri)) {
        title = title.replace(/=>/g, "⇒");
      }
    }
    if (/\.re$/.test(data.event.textDocument.uri)) {
      title = title.replace(/ : /g, ": ");
    }
    event.command = { command: "", title };
    return event;
  };
}

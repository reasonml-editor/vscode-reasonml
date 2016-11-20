import { types } from "../../shared";
import * as command from "../command";
import Session from "../session";
import * as server from "vscode-languageserver";

export default function(session: Session): server.RequestHandler<types.CodeLens, types.CodeLens, void> {
  return async (event, token) => {
    const data: types.SymbolInformation & { event: server.TextDocumentPositionParams, fileKind: "ml" | "re" } = event.data;
    const itemType = await command.getType(session, data.event, 1);
    if (token.isCancellationRequested) return event;
    if (itemType == null) return event;
    event.command = { command: "", title: itemType.type };
    if ("re" === data.fileKind) event.command.title = event.command.title.replace(/ : /g, ": ");
    if (!session.settings.reason.codelens.unicode) return event;
    if ("ml" === data.fileKind) event.command.title = event.command.title.replace(/->/g, "→");
    if ("ml" === data.fileKind) event.command.title = event.command.title.replace(/\*/g, "×");
    if ("re" === data.fileKind) event.command.title = event.command.title.replace(/=>/g, "⇒");
    return event;
  };
}

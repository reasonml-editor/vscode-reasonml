import { merlin, parser, types } from "../../shared";
import * as command from "../command";
import Session from "../session";
import * as server from "vscode-languageserver";

export default function(session: Session): server.RequestHandler<server.TextDocumentPositionParams, types.Hover, void> {
  return async (event, token) => {
    const position = { position: event.position, uri: event.textDocument.uri };
    const word = await command.getWordAtPosition(session, position);
    const markedStrings: types.MarkedString[] = [];
    const itemType = await command.getType(session, event);
    if (token.isCancellationRequested) return { contents: [] };
    const itemDocs = await command.getDocumentation(session, event);
    if (token.isCancellationRequested) return { contents: [] };
    if (itemType != null) {
      const language = /^[A-Z]/.test(word) ? "reason.hover.signature" : "reason.hover.type";
      markedStrings.push({ language, value: itemType.type });
      markedStrings.push(merlin.TailPosition.intoCode(itemType.tail)); // FIXME: make configurable
      if (itemDocs != null && !parser.ocamldoc.ignore.test(itemDocs)) markedStrings.push(parser.ocamldoc.intoMarkdown(itemDocs));
    }
    return { contents: markedStrings };
  };
}

import { merlin, parser, types } from "../../shared";
import * as command from "../command";
import Session from "../session";
import * as server from "vscode-languageserver";

export default function(session: Session): server.RequestHandler<server.TextDocumentPositionParams, types.Hover, void> {
  return async (event, token) => {
    const markedStrings: types.MarkedString[] = [];
    const itemType = await command.getType(session, event);
    if (token.isCancellationRequested) return { contents: [] };
    const itemDocs = await command.getDocumentation(session, event);
    if (token.isCancellationRequested) return { contents: [] };
    if (itemType != null) {
      markedStrings.push({ language: "reason.hover.type", value: itemType.type });
      markedStrings.push(merlin.TailPosition.intoCode(itemType.tail)); // FIXME: make configurable
      if (itemDocs != null && !parser.ocamldoc.ignore.test(itemDocs)) markedStrings.push(parser.ocamldoc.intoMarkdown(itemDocs));
    }
    return { contents: markedStrings };
  };
}

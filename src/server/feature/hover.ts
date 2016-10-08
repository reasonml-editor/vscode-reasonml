import * as merlin from "../../shared/merlin";
import * as ocamldoc from "../../shared/ocamldoc";
import * as types from "../../shared/types";
import * as method from "../method";
import { Session } from "../session";
import * as server from "vscode-languageserver";

export default function(session: Session): server.RequestHandler<server.TextDocumentPositionParams, types.Hover, void> {
  return async (event, token) => {
    const markedStrings: types.MarkedString[] = [];
    const itemType = await method.getType(session, event);
    if (token.isCancellationRequested) return { contents: [] };
    const itemDocs = await method.getDocs(session, event);
    if (token.isCancellationRequested) return { contents: [] };
    if (itemType != null) {
      markedStrings.push({ language: "reason.hover.type", value: itemType.type });
      markedStrings.push(merlin.TailPosition.intoCode(itemType.tail)); // FIXME: make configurable
      if (itemDocs != null && !ocamldoc.ignore.test(itemDocs)) markedStrings.push(ocamldoc.intoMarkdown(itemDocs));
    }
    return { contents: markedStrings };
  };
}

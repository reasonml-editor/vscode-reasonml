import * as ocamldoc from "../../shared/ocamldoc";
import * as method from "../method";
import * as merlin from "../process/merlin";
import { Session } from "../session";
import {
  RequestHandler,
  TextDocumentPositionParams,
} from "vscode-languageserver";
import {
  Hover,
  MarkedString,
} from "vscode-languageserver-types";

export function handler(session: Session): RequestHandler<TextDocumentPositionParams, Hover, void> {
  return async (event, token) => {
    const markedStrings: MarkedString[] = [];
    const itemType = await method.getType(session, event);
    if (token.isCancellationRequested) return { contents: [] };
    const itemDocs = await method.getDocs(session, event);
    if (token.isCancellationRequested) return { contents: [] };
    if (itemType != null) {
      markedStrings.push({ language: "reason.hover.type", value: itemType.type });
      markedStrings.push(merlin.data.TailPosition.intoCode(itemType.tail)); // FIXME: make configurable
      if (itemDocs != null && !ocamldoc.ignore.test(itemDocs)) {
        markedStrings.push(ocamldoc.intoMarkdown(itemDocs));
      }
    }
    return { contents: markedStrings };
  };
}

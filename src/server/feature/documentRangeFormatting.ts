import * as types from "../../shared/types";
import * as method from "../method";
import { Session } from "../session";
import * as server from "vscode-languageserver";

export default function(session: Session): server.RequestHandler<server.DocumentRangeFormattingParams, types.TextEdit[], void> {
  return async (event, token) => {
    const itxt = await method.getTextDocument(session, event.textDocument);
    const idoc = types.TextDocument.create(event.textDocument.uri, itxt.languageId, itxt.version, itxt.content);
    if (token.isCancellationRequested) return [];
    const otxt = await method.getFormatted(idoc, event.range);
    if (token.isCancellationRequested) return [];
    const edits: types.TextEdit[] = [];
    edits.push(types.TextEdit.replace(event.range, otxt));
    return edits;
  };
}

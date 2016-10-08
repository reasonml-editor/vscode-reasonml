import * as types from "../../shared/types";
import * as method from "../method";
import { Session } from "../session";
import * as server from "vscode-languageserver";

export default function(session: Session): server.RequestHandler<server.DocumentFormattingParams, types.TextEdit[], void> {
  return async (event, token) => {
    const itxt = await method.getTextDocument(session, event.textDocument);
    const idoc = types.TextDocument.create(event.textDocument.uri, itxt.languageId, itxt.version, itxt.content);
    if (token.isCancellationRequested) return [];
    const otxt = await method.getFormatted(idoc);
    if (token.isCancellationRequested) return [];
    const edits: types.TextEdit[] = [];
    edits.push(
      types.TextEdit.replace(
        types.Range.create(
          idoc.positionAt(0),
          idoc.positionAt(itxt.content.length)),
      otxt));
    return edits;
  };
}

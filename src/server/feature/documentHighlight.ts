import * as shared from "../../shared";
import * as types from "../../shared/types";
import * as method from "../method";
import { Session } from "../session";
import * as server from "vscode-languageserver";

export function handler(session: Session): server.RequestHandler<server.TextDocumentPositionParams, types.DocumentHighlight[], void> {
  return async (event, token) => {
    const occurrences = await method.getOccurrences(session, event);
    if (token.isCancellationRequested) return [];
    if (occurrences == null) return [];
    const highlights = occurrences.map((loc) => {
      const range = shared.merlin.Location.intoCode(loc);
      const kind = types.DocumentHighlightKind.Write;
      return types.DocumentHighlight.create(range, kind);
    });
    return highlights;
  };
}

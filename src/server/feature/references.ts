import * as ordinal from "../../shared/merlin/ordinal";
import * as method from "../method";
import { Session } from "../session";
import * as server from "vscode-languageserver";
import * as types from "vscode-languageserver-types";

export function handler(session: Session): server.RequestHandler<server.TextDocumentPositionParams, types.Location[], void> {
  return async (event, token) => {
    const occurrences = await method.getOccurrences(session, event);
    if (token.isCancellationRequested) return [];
    if (occurrences == null) return [];
    const highlights = occurrences.map((loc) => {
      const uri = event.textDocument.uri;
      const range = ordinal.Location.intoCode(loc);
      return types.Location.create(uri, range);
    });
    return highlights;
  };
}

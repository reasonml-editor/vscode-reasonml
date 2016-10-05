import * as ordinal from "../../shared/merlin/ordinal";
import * as method from "../method";
import { Session } from "../session";
import {
  RequestHandler,
  TextDocumentPositionParams,
} from "vscode-languageserver";
import {
  DocumentHighlight,
  DocumentHighlightKind,
} from "vscode-languageserver-types";

export function handler(session: Session): RequestHandler<TextDocumentPositionParams, DocumentHighlight[], void> {
  return async (event, token) => {
    const occurrences = await method.getOccurrences(session, event);
    if (token.isCancellationRequested) return [];
    if (occurrences == null) return [];
    const highlights = occurrences.map((loc) => {
      const range = ordinal.Location.intoCode(loc);
      const kind = DocumentHighlightKind.Write;
      return DocumentHighlight.create(range, kind);
    });
    return highlights;
  };
}

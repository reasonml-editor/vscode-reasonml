import * as ordinal from "../../shared/merlin/ordinal";
import * as merlin from "../process/merlin";
import { Session } from "../session";
import {
  RequestHandler,
  ResponseError,
  TextDocumentPositionParams,
} from "vscode-languageserver";
import {
  DocumentHighlight,
  DocumentHighlightKind,
} from "vscode-languageserver-types";

export function handler(session: Session): RequestHandler<TextDocumentPositionParams, DocumentHighlight[], void> {
  return async (event) => {
    const position = merlin.ordinal.Position.fromCode(event.position);
    const request = merlin.command.Query.occurrences.ident.at(position);
    const response = await session.merlin.query(request, event.textDocument.uri);
    if (response.class !== "return") return new ResponseError(-1, "onDocumentHighlight: failed", undefined);
    const highlights = response.value.map((loc) => {
      const range = ordinal.Location.intoCode(loc);
      const kind = DocumentHighlightKind.Write;
      return DocumentHighlight.create(range, kind);
    });
    return highlights;
  };
}

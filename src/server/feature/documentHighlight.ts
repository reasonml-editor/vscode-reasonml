import { merlin, types } from "../../shared";
import * as command from "../command";
import Session from "../session";
import * as server from "vscode-languageserver";

export default function(session: Session): server.RequestHandler<server.TextDocumentPositionParams, types.DocumentHighlight[], void> {
  return async (event, token) => {
    const occurrences = await command.getOccurrences(session, event);
    if (token.isCancellationRequested) return [];
    if (occurrences == null) return [];
    const highlights = occurrences.map((loc) => {
      const range = merlin.Location.intoCode(loc);
      const kind = types.DocumentHighlightKind.Write;
      return types.DocumentHighlight.create(range, kind);
    });
    return highlights;
  };
}

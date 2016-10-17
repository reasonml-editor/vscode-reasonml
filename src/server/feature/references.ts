import { merlin, types } from "../../shared";
import * as command from "../command";
import Session from "../session";
import * as server from "vscode-languageserver";

export default function(session: Session): server.RequestHandler<server.TextDocumentPositionParams, types.Location[], void> {
  return async (event, token) => {
    const occurrences = await command.getOccurrences(session, event);
    if (token.isCancellationRequested) return [];
    if (occurrences == null) return [];
    const highlights = occurrences.map((loc) => {
      const uri = event.textDocument.uri;
      const range = merlin.Location.intoCode(loc);
      return types.Location.create(uri, range);
    });
    return highlights;
  };
}

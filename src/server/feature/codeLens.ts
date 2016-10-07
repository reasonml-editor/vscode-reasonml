import * as types from "../../shared/types";
import * as merlin from "../process/merlin";
import * as session from "../session";
import * as rpc from "vscode-jsonrpc";
import * as server from "vscode-languageserver";

const annotateKinds = new Set([
  types.SymbolKind.Variable,
]);

export function handler(session: session.Session): server.RequestHandler<server.CodeLensParams, types.CodeLens[], void> {
  return async (event, token) => {
    if (/\.rei$/.test(event.textDocument.uri)) return [];
    const request = merlin.Query.outline();
    const response = await session.merlin.query(request, event.textDocument.uri);
    if (token.isCancellationRequested) return [];
    if (response.class !== "return") return new rpc.ResponseError(-1, "onCodeLens: failed", undefined);
    const symbols = merlin.Outline.intoCode(response.value, event.textDocument.uri);
    let codeLenses: types.CodeLens[] = [];
    for (const item of symbols) {
      if (item != null && annotateKinds.has(item.kind)) {
        const params = {
          position: types.Position.create(item.location.range.start.line, item.location.range.start.character),
          textDocument: event.textDocument,
        };
        const textDoc = session.synchronizer.get(event.textDocument.uri);
        const textLine = textDoc.getText().substring(
          textDoc.offsetAt(item.location.range.start),
          textDoc.offsetAt(item.location.range.end),
        );
        if (textLine != null) {
          const matches = textLine.match(/^\s*\b(and|let)\b(\s*)(\brec\b)?(\s*)/);
          if (matches != null) {
            params.position.character += matches[1].length;
            params.position.character += matches[2].length;
            params.position.character += matches[3] ? matches[3].length : 0;
            params.position.character += matches[4].length;
            const data: types.SymbolInformation & { event: server.TextDocumentPositionParams } = {
              containerName: item.containerName,
              event: params,
              kind: item.kind,
              location: item.location,
              name: item.name,
            };
            codeLenses.push({ data, range: item.location.range });
          }
        }
      }
    }
    return codeLenses;
  };
}

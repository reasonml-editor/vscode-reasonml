import * as merlin from "../process/merlin";
import { Session } from "../session";
import {
  ResponseError,
} from "vscode-jsonrpc";
import {
  CodeLensParams,
  RequestHandler,
  TextDocumentPositionParams,
} from "vscode-languageserver";
import {
  CodeLens,
  Position,
  SymbolInformation,
  SymbolKind,
} from "vscode-languageserver-types";

const annotateKinds = new Set([
  SymbolKind.Variable,
]);

export function handler(session: Session): RequestHandler<CodeLensParams, CodeLens[], void> {
  return async (event, token) => {
    if (/\.rei$/.test(event.textDocument.uri)) return [];
    const request = merlin.command.Query.outline();
    const response = await session.merlin.query(request, event.textDocument.uri);
    if (token.isCancellationRequested) return [];
    if (response.class !== "return") return new ResponseError(-1, "onCodeLens: failed", undefined);
    const symbols = merlin.data.Outline.intoCode(response.value, event.textDocument.uri);
    let codeLenses: CodeLens[] = [];
    for (const item of symbols) {
      if (item != null && annotateKinds.has(item.kind)) {
        const params = {
          position: Position.create(item.location.range.start.line, item.location.range.start.character),
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
            const data: SymbolInformation & { event: TextDocumentPositionParams } = {
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

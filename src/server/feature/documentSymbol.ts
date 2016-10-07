import * as types from "../../shared/types";
import * as merlin from "../process/merlin";
import { Session } from "../session";
import * as rpc from "vscode-jsonrpc";
import * as server from "vscode-languageserver";

export function handler(session: Session): server.RequestHandler<server.DocumentSymbolParams, types.SymbolInformation[], void> {
  return async (event, token) => {
    const request = merlin.Query.outline();
    const response = await session.merlin.query(request, event.textDocument.uri);
    if (token.isCancellationRequested) return [];
    if (response.class !== "return") return new rpc.ResponseError(-1, "onDocumentSymbol: failed", undefined);
    const symbols = merlin.Outline.intoCode(response.value, event.textDocument.uri);
    return symbols;
  };
}

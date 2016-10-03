import * as merlin from "../process/merlin";
import { Session } from "../session";
import {
  DocumentSymbolParams,
  RequestHandler,
  ResponseError,
} from "vscode-languageserver";
import {
  SymbolInformation,
} from "vscode-languageserver-types";

export function handler(session: Session): RequestHandler<DocumentSymbolParams, SymbolInformation[], void> {
  return async (event) => {
    const request = merlin.command.Query.outline();
    const response = await session.merlin.query(request, event.textDocument.uri);
    if (response.class !== "return") return new ResponseError(-1, "onDocumentSymbol: failed", undefined);
    const symbols = merlin.data.Outline.intoCode(response.value, event.textDocument.uri);
    return symbols;
  };
}

import * as method from "../method";
import * as merlin from "../process/merlin";
import { Session } from "../session";
import {
  ResponseError,
} from "vscode-jsonrpc";
import {
  RequestHandler,
  TextDocumentPositionParams,
} from "vscode-languageserver";
import {
  CompletionItem,
} from "vscode-languageserver-types";

export function handler(session: Session): RequestHandler<TextDocumentPositionParams, CompletionItem[], void> {
  return async (event, token) => {
    let error = null;
    let prefix: null | string = null;
    try {
      prefix = await method.getPrefix(session, event);
      if (token.isCancellationRequested) return [];
    } catch (err) {
      // ignore errors from completing ' .'
      error = err;
    }
    if (error != null || prefix == null) return [];
    const position = merlin.ordinal.Position.fromCode(event.position);
    const request = merlin.command.Query.complete.prefix(prefix).at(position).with.doc();
    const response = await session.merlin.query(request, event.textDocument.uri);
    if (token.isCancellationRequested) return [];
    if (response.class !== "return") return new ResponseError(-1, "onCompletion: failed", undefined);
    const entries = response.value.entries ? response.value.entries : [];
    return entries.map(merlin.data.Completion.intoCode);
  };
}

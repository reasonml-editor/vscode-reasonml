import * as merlin from "../process/merlin";
import { Session } from "../session";
import getPrefix from "./getPrefix";
import {
  RequestHandler,
  ResponseError,
  TextDocumentPositionParams,
} from "vscode-languageserver";
import {
  CompletionItem,
} from "vscode-languageserver-types";

export function handler(session: Session): RequestHandler<TextDocumentPositionParams, CompletionItem[], void> {
  return async (event) => {
    let error = undefined;
    let prefix: string | undefined = undefined;
    try {
      prefix = await getPrefix(session, event);
    } catch (err) {
      // ignore errors from completing ' .'
      error = err;
    }
    if (error != null || prefix == null) return [];
    const position = merlin.ordinal.Position.fromCode(event.position);
    const request = merlin.command.Query.complete.prefix(prefix).at(position).with.doc();
    const response = await session.merlin.query(request, event.textDocument.uri);
    if (response.class !== "return") return new ResponseError(-1, "onCompletion: failed", undefined);
    const entries = response.value.entries ? response.value.entries : [];
    return entries.map(merlin.data.Completion.intoCode);
  };
}

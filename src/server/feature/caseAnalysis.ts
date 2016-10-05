import * as merlin from "../process/merlin";
import { Session } from "../session";
import {
  RequestHandler,
} from "vscode-languageserver";
import {
  Range,
} from "vscode-languageserver-types";

type DocumentRange = {
  range: Range,
  textDocument: { uri: string },
};

export function handler(session: Session): RequestHandler<
  DocumentRange, Promise<null | merlin.data.Case.Destruct>, void
> {
  return async (event, token) => {
    const start = merlin.ordinal.Position.fromCode(event.range.start);
    const end = merlin.ordinal.Position.fromCode(event.range.end);
    const request = merlin.command.Query.kase.analysis.from(start).to(end);
    const response = await session.merlin.query(request, event.textDocument.uri);
    if (token.isCancellationRequested) return null;
    if (response.class !== "return") throw response.value;
    return response.value;
  };
}

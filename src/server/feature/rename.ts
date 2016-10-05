import * as ordinal from "../../shared/merlin/ordinal";
import * as method from "../method";
import { Session } from "../session";
import {
  RenameParams,
  RequestHandler,
} from "vscode-languageserver";
import {
  TextEdit,
  WorkspaceEdit,
} from "vscode-languageserver-types";

export function handler(session: Session): RequestHandler<RenameParams, WorkspaceEdit, void> {
  return async (event, token) => {
    const occurrences = await method.getOccurrences(session, event);
    if (token.isCancellationRequested) return { changes: {} };
    if (occurrences == null) return { changes: {} };
    const renamings = occurrences.map((loc) => TextEdit.replace(ordinal.Location.intoCode(loc), event.newName));
    const edit: WorkspaceEdit = { changes: { [event.textDocument.uri]: renamings } };
    return edit;
  };
}

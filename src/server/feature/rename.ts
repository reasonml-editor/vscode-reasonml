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
  return async (event) => {
    const edit: WorkspaceEdit = { changes: {} };
    const occurrences = await method.getOccurrences(session, event);
    if (occurrences == null) return edit;
    const renamings = occurrences.map((loc) => TextEdit.replace(ordinal.Location.intoCode(loc), event.newName));
    edit.changes[event.textDocument.uri] = renamings;
    return edit;
  };
}

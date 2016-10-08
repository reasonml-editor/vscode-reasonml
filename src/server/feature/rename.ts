import * as merlin from "../../shared/merlin";
import * as types from "../../shared/types";
import * as method from "../method";
import { Session } from "../session";
import * as server from "vscode-languageserver";

export default function(session: Session): server.RequestHandler<server.RenameParams, types.WorkspaceEdit, void> {
  return async (event, token) => {
    const occurrences = await method.getOccurrences(session, event);
    if (token.isCancellationRequested) return { changes: {} };
    if (occurrences == null) return { changes: {} };
    const renamings = occurrences.map((loc) => types.TextEdit.replace(merlin.Location.intoCode(loc), event.newName));
    const edit: types.WorkspaceEdit = { changes: { [event.textDocument.uri]: renamings } };
    return edit;
  };
}

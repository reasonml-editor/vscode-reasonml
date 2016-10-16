import { types } from "../../shared";
import { Session } from "../session";
import * as server from "vscode-languageserver";

export default function(session: Session): server.RequestHandler<server.WorkspaceSymbolParams, types.SymbolInformation[], void> {
  return (event) => {
    return session.index.findSymbols({ name: { "$regex": event.query }});
  };
}

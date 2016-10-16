import { Session } from "../session";
import * as server from "vscode-languageserver";

export default async function(session: Session, event: server.TextDocumentIdentifier): Promise<server.TextDocumentIdentifier[]> {
  return session.getModules(event);
}

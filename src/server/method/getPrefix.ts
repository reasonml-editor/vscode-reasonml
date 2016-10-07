import { Session } from "../session";
import * as server from "vscode-languageserver";

export default async function(session: Session, event: server.TextDocumentPositionParams): Promise<null | string> {
  const method = { method: "getPrefix" };
  return session.connection.sendRequest<server.TextDocumentPositionParams, null | string, void>(method, event);
}

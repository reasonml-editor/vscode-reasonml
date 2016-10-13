import { remote } from "../../shared";
import { Session } from "../session";
import * as server from "vscode-languageserver";

export default async function(session: Session, event: server.TextDocumentPositionParams): Promise<null | string> {
  return session.connection.sendRequest(remote.client.givePrefix, event);
}

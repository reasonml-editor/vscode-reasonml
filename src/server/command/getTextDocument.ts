import { remote, types } from "../../shared";
import { Session } from "../session";

export default async function(session: Session, event: types.TextDocumentIdentifier): Promise<types.TextDocumentData> {
  return session.connection.sendRequest(remote.client.giveTextDocument, event);
}

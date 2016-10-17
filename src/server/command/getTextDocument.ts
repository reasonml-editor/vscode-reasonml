import { remote, types } from "../../shared";
import Session from "../session";

export default async function(session: Session, event: types.TextDocumentIdentifier): Promise<types.TextDocument> {
  const data = await session.connection.sendRequest(remote.client.giveTextDocument, event);
  return types.TextDocument.create(event.uri, data.languageId, data.version, data.content);
}

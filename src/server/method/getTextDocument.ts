import * as types from "../../shared/types";
import { Session } from "../session";

export default async function(session: Session, event: types.TextDocumentIdentifier): Promise<types.TextDocumentData> {
  const method = { method: "getTextDocument" };
  return session.connection.sendRequest<types.TextDocumentIdentifier, types.TextDocumentData, void>(method, event);
}

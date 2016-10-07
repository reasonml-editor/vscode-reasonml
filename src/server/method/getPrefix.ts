import { Session } from "../session";
import {
  TextDocumentPositionParams,
} from "vscode-languageserver";

export default async function(session: Session, event: TextDocumentPositionParams): Promise<null | string> {
  const method = { method: "getPrefix" };
  return session.connection.sendRequest<TextDocumentPositionParams, null | string, void>(method, event);
}

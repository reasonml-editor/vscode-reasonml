import { Session } from "../session";
import {
  TextDocumentPositionParams,
} from "vscode-languageserver";

export default async function(session: Session, event: TextDocumentPositionParams): Promise<string | undefined> {
  const method = "getText";
  return session.connection.sendRequest<TextDocumentPositionParams, string | undefined, void>({ method }, event);
}

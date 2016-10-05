import * as merlin from "../process/merlin";
import { Session } from "../session";
import {
  TextDocumentPositionParams,
} from "vscode-languageserver";

export default async (session: Session, event: TextDocumentPositionParams): Promise<null | string> => {
  const position = merlin.ordinal.Position.fromCode(event.position);
  const request = merlin.command.Query.document(null).at(position);
  const response = await session.merlin.query(request, event.textDocument.uri);
  if (response.class !== "return") return null;
  return response.value;
};

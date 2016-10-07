import * as ordinal from "../../shared/merlin/ordinal";
import * as merlin from "../process/merlin";
import { Session } from "../session";
import * as server from "vscode-languageserver";

export default async (session: Session, event: server.TextDocumentPositionParams): Promise<null | ordinal.Location[]> => {
  const position = merlin.Position.fromCode(event.position);
  const request = merlin.Query.occurrences.ident.at(position);
  const response = await session.merlin.query(request, event.textDocument.uri);
  if (response.class !== "return") return null;
  return response.value;
};

import * as ordinal from "../../shared/merlin/ordinal";
import * as merlin from "../process/merlin";
import { Session } from "../session";
import {
  TextDocumentPositionParams,
} from "vscode-languageserver";

export default async (session: Session, event: TextDocumentPositionParams): Promise<ordinal.Location[] | undefined> => {
  const position = merlin.ordinal.Position.fromCode(event.position);
  const request = merlin.command.Query.occurrences.ident.at(position);
  const response = await session.merlin.query(request, event.textDocument.uri);
  if (response.class !== "return") return undefined;
  return response.value;
};

import * as merlin from "../process/merlin";
import { Session } from "../session";
import {
  TextDocumentPositionParams,
} from "vscode-languageserver";

export default async (session: Session, event: TextDocumentPositionParams): Promise<undefined | {
  end: merlin.ordinal.Position;
  start: merlin.ordinal.Position;
  tail: merlin.data.TailPosition;
  type: string;
}> => {
  const position = merlin.ordinal.Position.fromCode(event.position);
  const request = merlin.command.Query.type.enclosing.at(position);
  const response = await session.merlin.query(request, event.textDocument.uri);
  if (response.class !== "return") return undefined;
  return (response.value.length > 0) ? response.value[0] : undefined;
};

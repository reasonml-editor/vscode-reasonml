import * as merlin from "../process/merlin";
import { Session } from "../session";
import {
  RequestHandler,
  TextDocumentPositionParams,
} from "vscode-languageserver";
import {
  Definition,
  Location,
  Range,
} from "vscode-languageserver-types";

export function handler(session: Session): RequestHandler<TextDocumentPositionParams, Definition, void> {
  return async (event) => {
    const find = async (kind: "ml" | "mli"): Promise<Location | undefined> => {
      const request = merlin.command.Query.locate(null, kind).at(merlin.ordinal.Position.fromCode(event.position));
      const response = await session.merlin.query(request, event.textDocument.uri);
      if (response.class !== "return" || response.value.pos == null) return undefined;
      const value = response.value;
      const uri = value.file ? `file://${value.file}` : event.textDocument.uri;
      const position = merlin.ordinal.Position.intoCode(value.pos);
      const range = Range.create(position, position);
      const location = Location.create(uri, range);
      return location;
    };
    const locML = await find("ml");
    // const locMLI = await find("mli"");
    const locations: Location[] = [];
    if (locML != null) locations.push(locML);
    // if (locMLI != null) locations.push(locMLI);
    return locations;
  };
}

import * as ocamldoc from "../../shared/ocamldoc";
import * as merlin from "../process/merlin";
import { Session } from "../session";
import {
  RequestHandler,
  TextDocumentPositionParams,
} from "vscode-languageserver";
import {
  Hover,
  MarkedString,
} from "vscode-languageserver-types";

const getType = async (session: Session, event: TextDocumentPositionParams): Promise<undefined | {
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

const getDocs = async (session: Session, event: TextDocumentPositionParams): Promise<string | undefined> => {
  const position = merlin.ordinal.Position.fromCode(event.position);
  const request = merlin.command.Query.document(null).at(position);
  const response = await session.merlin.query(request, event.textDocument.uri);
  if (response.class !== "return") return undefined;
  return response.value;
};

export function handler(session: Session): RequestHandler<TextDocumentPositionParams, Hover, void> {
  return async (event) => {
    const markedStrings: MarkedString[] = [];
    const itemType = await getType(session, event);
    const itemDocs = await getDocs(session, event);
    if (itemType != null) {
      markedStrings.push({ language: "reason.hover.type", value: itemType.type });
      markedStrings.push(merlin.data.TailPosition.intoCode(itemType.tail)); // FIXME: make configurable
      if (itemDocs != null && !ocamldoc.ignore.test(itemDocs)) {
        markedStrings.push(ocamldoc.intoMarkdown(itemDocs));
      }
    }
    return { contents: markedStrings };
  };
}

import { merlin } from "../../shared";
import Session from "../session";
import * as server from "vscode-languageserver";

export default async function(session: Session, event: server.TextDocumentIdentifier, priority: number = 0): Promise<string[]> {
  const request = merlin.Query.project.get();
  const response = await session.merlin.query(request, event.uri, priority);
  if (response.class !== "return") return [];
  return response.value.result;
}

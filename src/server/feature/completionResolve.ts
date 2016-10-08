import * as shared from "../../shared";
import * as types from "../../shared/types";
import { Session } from "../session";
import * as server from "vscode-languageserver";

export default function(session: Session): server.RequestHandler<types.CompletionItem, types.CompletionItem, void> {
  void session; // tslint:disable-line
  return (event) => {
    // FIXME: might want to make a separate parser to just strip ocamldoc
    const documentation: string = event.data.documentation
      .replace(/\{\{:.*?\}(.*?)\}/g, "$1")
      .replace(/\{!(.*?)\}/g, "$1");
    const markedDoc = shared.ocamldoc.intoMarkdown(documentation)
      .replace(/`(.*?)`/g, "$1")
      .replace(/\s+/g, " ")
      .replace(/\n/g, "");
    event.documentation = markedDoc;
    return event;
  };
}

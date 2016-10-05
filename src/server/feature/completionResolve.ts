import * as ocamldoc from "../../shared/ocamldoc";
import { Session } from "../session";
import {
  RequestHandler,
} from "vscode-languageserver";
import {
  CompletionItem,
} from "vscode-languageserver-types";

export function handler(session: Session): RequestHandler<CompletionItem, CompletionItem, void> {
  void session; // tslint:disable-line
  return (event) => {
    // FIXME: might want to make a separate parser to just strip ocamldoc
    const documentation: string = event.data.documentation
      .replace(/\{\{:.*?\}(.*?)\}/g, "$1")
      .replace(/\{!(.*?)\}/g, "$1");
    const markedDoc = ocamldoc.intoMarkdown(documentation)
      .replace(/`(.*?)`/g, "$1")
      .replace(/\s+/g, " ")
      .replace(/\n/g, "");
    event.documentation = markedDoc;
    return event;
  };
}

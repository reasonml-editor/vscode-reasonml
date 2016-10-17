// import { merlin, types } from "../../shared";
import Session from "../session";
import * as server from "vscode-languageserver";

export default function(session: Session): server.NotificationHandler<server.DidChangeConfigurationParams> {
  return session.onDidChangeConfiguration.bind(session);
}

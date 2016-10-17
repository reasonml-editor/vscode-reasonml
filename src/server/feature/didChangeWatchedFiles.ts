import Session from "../session";
import * as server from "vscode-languageserver";

export default function(session: Session): server.NotificationHandler<server.DidChangeWatchedFilesParams> {
  return async (event) => {
    for (const { uri } of event.changes) {
      if (/\.(ml|re)$/.test(uri)) await session.indexer.refreshSymbols({ uri });
    }
  };
}

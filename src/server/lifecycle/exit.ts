import Session from "../session";
import * as server from "vscode-languageserver";

export default function(_: Session): server.NotificationHandler<void> {
  return () => {
    // session.dispose();
  };
}

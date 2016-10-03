import capabilities from "../capabilities";
import * as merlin from "../process/merlin";
import { Session } from "../session";
import {
  InitializeError,
  InitializeParams,
  InitializeResult,
  RequestHandler,
} from "vscode-languageserver";

export function handler(session: Session): RequestHandler<InitializeParams, InitializeResult, InitializeError> {
  return async () => {
    const request = merlin.command.Sync.protocol.version.set(3);
    const response = await session.merlin.sync(request);
    if (response.class !== "return" || response.value.selected !== 3) {
      session.connection.dispose();
      throw new Error("onInitialize: failed to establish protocol v3");
    }
    return { capabilities };
  };
}

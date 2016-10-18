import { types } from "../../shared";
import Session from "../session";
import { ChildProcess } from "child_process";
import * as childProcess from "child_process";

export default class ReFMT {
  public readonly child: ChildProcess;
  constructor(session: Session, id?: types.TextDocumentIdentifier, argsOpt?: string[], ) {
    const uri = id ? id.uri : ".re";
    const path = session.settings.reason.path.refmt;
    const args = argsOpt || [
      "-use-stdin", "true",
      "-parse", "re",
      "-print", "re",
      "-is-interface-pp", `${/\.rei$/.test(uri)}`,
    ];
    this.child = childProcess.spawn(path, args);
    return this;
  }
}

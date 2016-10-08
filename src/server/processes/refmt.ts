import { ChildProcess } from "child_process";
import * as childProcess from "child_process";

export default class ReFMT {
  readonly child: ChildProcess;
  constructor(uri: string = ".re", pathOpt?: string, argsOpt?: string[], ) {
    const path = pathOpt || "refmt";
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

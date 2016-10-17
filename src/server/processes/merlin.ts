import { merlin } from "../../shared";
import Session from "../session";
import * as child_process from "child_process";
import * as _ from "lodash";
import * as readline from "readline";

export default class Merlin {
  private pending: Promise<void> = Promise.resolve();
  private process: child_process.ChildProcess;
  private readline: readline.ReadLine;
  private session: Session;

  constructor(session: Session) {
    this.session = session;
  }

  public dispose(): void {
    this.readline.close();
    this.process.disconnect();
  }

  public initialize(): void {
    const ocamlmerlin = this.session.settings.reason.path.ocamlmerlin;
    this.process = child_process.spawn(this.session.settings.reason.path.ocamlmerlin, []);
    this.process.on("error", (error: Error & { code: string }) => {
      if (error.code === "ENOENT") {
        const msg = `Cannot find merlin binary at "${ocamlmerlin}".`;
        this.session.connection.window.showWarningMessage(msg);
        this.session.connection.window.showWarningMessage(`Double check your path or try configuring "reason.path.ocamlmerlin" under "User Settings".`);
        throw error;
     }
    });
    this.readline = readline.createInterface({
      input: this.process.stdout,
      output: this.process.stdin,
      terminal: false,
    });
  }

  public query<I, O>(request: merlin.Query<I, O>, path?: string): merlin.Response<O> {
    const context: ["auto", string] | undefined = path ? ["auto", path] : undefined;
    return this.question<I, merlin.MerlinResponse<O>>(request.query, context);
  }

  public sync<I, O>(request: merlin.Sync<I, O>, path?: string): merlin.Response<O> {
    const context: ["auto", string] | undefined = path ? ["auto", path] : undefined;
    return this.question<I, merlin.MerlinResponse<O>>(request.sync, context);
  }

  private question<I, O>(query: I, context?: ["auto", string]): Promise<O> {
    const request = context ? { context, query } : query;
    const promise: Promise<O> = this.pending.then(() => new Promise((resolve) =>
      this.readline.question(JSON.stringify(request), _.flow(JSON.parse, resolve))));
    this.pending = promise.then(() => Promise.resolve());
    return promise;
  }
}

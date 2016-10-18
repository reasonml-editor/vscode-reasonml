import { merlin, types } from "../../shared";
import Session from "../session";
import * as async from "async";
import * as child_process from "child_process";
import * as _ from "lodash";
import * as readline from "readline";

export default class Merlin {
  private readonly queue: AsyncPriorityQueue<any>;
  private readline: readline.ReadLine;
  private process: child_process.ChildProcess;
  private readonly session: Session;

  constructor(session: Session) {
    this.session = session;
    this.queue = async.priorityQueue((task, callback) => {
      this.readline.question(JSON.stringify(task), _.flow(JSON.parse, callback));
    }, 1);
    return this;
  }

  public dispose(): void {
    this.readline.close();
  }

  public initialize(): void {
    const ocamlmerlin = this.session.settings.reason.path.ocamlmerlin;
    this.process = child_process.spawn(this.session.settings.reason.path.ocamlmerlin, []);
    this.process.on("error", (error: Error & { code: string }) => {
      if (error.code === "ENOENT") {
        const msg = `Cannot find merlin binary at "${ocamlmerlin}".`;
        this.session.connection.window.showWarningMessage(msg);
        this.session.connection.window.showWarningMessage(`Double check your path or try configuring "reason.path.ocamlmerlin" under "User Settings".`);
        this.dispose();
        throw error;
     }
    });
    this.readline = readline.createInterface({
      input: this.process.stdout,
      output: this.process.stdin,
      terminal: false,
    });
  }

  public query<I, O>({ query }: merlin.Query<I, O>, id?: types.TextDocumentIdentifier, priority: number = 0): merlin.Response<O> {
    const context: ["auto", string] | undefined = id ? ["auto", id.uri] : undefined;
    const request = context ? { context, query } : query;
    return new Promise((resolve) => this.queue.push([request], priority, resolve));
  }

  public sync<I, O>({ sync: query }: merlin.Sync<I, O>, id?: types.TextDocumentIdentifier, priority: number = 0): merlin.Response<O> {
    const context: ["auto", string] | undefined = id ? ["auto", id.uri] : undefined;
    const request = context ? { context, query } : query;
    return new Promise((resolve) => this.queue.push([request], priority, resolve));
  }
}

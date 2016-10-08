import * as merlin from "../../shared/merlin";
import * as child_process from "child_process";
import * as _ from "lodash";
import * as readline from "readline";

export default class Merlin {
  private pending: Promise<void> = Promise.resolve();
  private process: child_process.ChildProcess;
  private readline: readline.ReadLine;
  constructor() {
    this.process = child_process.spawn("ocamlmerlin", []);
    this.readline = readline.createInterface({
      input: this.process.stdout,
      output: this.process.stdin,
      terminal: false,
    });
  }
  dispose() {
    this.readline.close();
    this.process.disconnect();
  }
  question<I, O>(query: I, context?: ["auto", string]): Promise<O> {
    const request = context ? { context, query } : query;
    const promise: Promise<O> = this.pending.then(() => new Promise((resolve) =>
      this.readline.question(JSON.stringify(request), _.flow(JSON.parse, resolve))));
    this.pending = promise.then(() => Promise.resolve());
    return promise;
  }
  query<I, O>(request: merlin.Query<I, O>, path?: string): merlin.Response<O> {
    const context: ["auto", string] | undefined = path ? ["auto", path] : undefined;
    return this.question<I, merlin.MerlinResponse<O>>(request.query, context);
  }
  sync<I, O>(request: merlin.Sync<I, O>, path?: string): merlin.Response<O> {
    const context: ["auto", string] | undefined = path ? ["auto", path] : undefined;
    return this.question<I, merlin.MerlinResponse<O>>(request.sync, context);
  }
}

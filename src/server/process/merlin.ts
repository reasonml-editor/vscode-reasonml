import * as types from "../../shared/merlin";
import * as child_process from "child_process";
import * as readline from "readline";

export * from "../../shared/merlin";

export class Session {
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
  public dispose() {
    this.readline.close();
    this.process.disconnect();
  }
  public question<I, O>(query: I, context?: ["auto", string]): Promise<O> {
    const request = context ? { context, query } : query;
    return new Promise((resolve) => {
      this.readline.question(JSON.stringify(request), (answer) => {
        resolve(JSON.parse(answer));
      });
    });
  }
  public query<I, O>(request: types.Command.Query<I, O>, path?: string): types.Response<O> {
    const context: ["auto", string] | undefined = path ? ["auto", path] : undefined;
    return this.question<I, types.MerlinResponse<O>>(request.query, context);
  }
  public sync<I, O>(request: types.Command.Sync<I, O>, path?: string): types.Response<O> {
    const context: ["auto", string] | undefined = path ? ["auto", path] : undefined;
    return this.question<I, types.MerlinResponse<O>>(request.sync, context);
  }
}

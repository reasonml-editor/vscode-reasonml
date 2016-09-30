import * as child_process from "child_process";
import * as readline from "readline";
import * as types from "vscode-languageserver-types";

/**
 * JSON data
 */

export interface IJSONArray extends Array<JSONValue> {
}

export interface IJSONObject {
  [key: string]: JSONValue;
}

export type JSONValue
  = boolean
  | IJSONArray
  | IJSONObject
  | number
  | string
  ;

/**
 * Merlin position data
 */

export type PositionColumnLine = {
  col: number;
  line: number;
}

export type Position
  = "start"
  | "end"
  | number
  | PositionColumnLine
  ;
export namespace Position {
  export function fromCode({ character: col, line }: types.Position): PositionColumnLine {
    return { col, line: line + 1 };
  }
  export function intoCode({ col: character, line }: PositionColumnLine): types.Position {
    return { character, line: line - 1 };
  }
}

export type Location = {
  start: Position;
  end: Position;
};

/**
 * Merlin response data
 */

export type MerlinNotification = {
  section: string;
  message: string;
}

export type MerlinResponse<T> = {
  class: "return";
  value: T;
  notifications: MerlinNotification;
} | {
  class: "failure";
  value: string;
  notifications: MerlinNotification;
} | {
  class: "error";
  value: string;
  notifications: MerlinNotification;
} | {
  class: "exception";
  value: JSONValue;
  notifications: MerlinNotification;
};

export type Response<T> = Promise<MerlinResponse<T>>;

/**
 * Merlin command data
 */

export namespace Case {
  export type Destruct = [{ end: PositionColumnLine; start: PositionColumnLine }, string];
}

export namespace Completion {
  export type Label = {
    name: string;
    type: string;
  };
  export type Context
    = null
    | ["application", { argument_type: string; labels: Label[] }];
  export type Kind
    = "#"
    | "Class"
    | "Constructor"
    | "Exn"
    | "Label"
    | "Method"
    | "Module"
    | "Signature"
    | "Type"
    | "Value"
    | "Variant";
  export namespace Kind {
    export function intoCode(kind: Kind): types.CompletionItemKind {
      switch (kind) {
        case "#": return types.CompletionItemKind.Method;
        case "Class": return types.CompletionItemKind.Class;
        case "Constructor": return types.CompletionItemKind.Constructor;
        case "Exn": return types.CompletionItemKind.Constructor;
        case "Label": return types.CompletionItemKind.Field;
        case "Method": return types.CompletionItemKind.Function;
        case "Module": return types.CompletionItemKind.Module;
        case "Signature": return types.CompletionItemKind.Interface;
        case "Type": return types.CompletionItemKind.Class;
        case "Value": return types.CompletionItemKind.Value;
        case "Variant": return types.CompletionItemKind.Enum;
        default: throw new Error(`<unreachable>: ${kind}`);
      }
    }
  }
  export type Entry = {
    name: string;
    kind: Kind;
    desc: string;
    info: string;
  };
  export function intoCode({ name: label, kind, desc: detail, info: documentation }: Entry): types.CompletionItem {
    return { detail, documentation, label, kind: Kind.intoCode(kind) };
  }
}

export type ErrorReport = {
  start: PositionColumnLine;
  end: PositionColumnLine;
  valid: boolean;
  message: string;
  type: ErrorReport.Type;
};
export namespace ErrorReport {
  export type Type
  = "env"
  | "parser"
  | "type"
  | "unknown"
  | "warning"
  ;
  export namespace Type {
    export function intoCode(type: Type): types.DiagnosticSeverity {
      switch (type) {
        case "env": return types.DiagnosticSeverity.Error;
        case "parser": return types.DiagnosticSeverity.Error;
        case "type": return types.DiagnosticSeverity.Error;
        case "unknown": return types.DiagnosticSeverity.Error;
        case "warning": return types.DiagnosticSeverity.Warning;
        default: throw new Error(`<unreachable>: ${type}`);
      }
    }
  }
  export function intoCode(report: ErrorReport): types.Diagnostic {
    const range = {
      end: Position.intoCode(report.end),
      start: Position.intoCode(report.start),
    };
    const message = report.message;
    const severity = Type.intoCode(report.type);
    const codeMatch = /^Warning\s*(\d+)?:/.exec(report.message);
    const code = codeMatch && codeMatch.length > 1 ? codeMatch[1] : "";
    const source = "merlin";
    return types.Diagnostic.create(range, message, severity, code, source);
  }
}

export namespace Outline {
  export type Kind
    = "Class"
    | "Constructor"
    | "Exn"
    | "Label"
    | "Method"
    | "Modtype"
    | "Module"
    | "Type"
    | "Value"
    ;
  export namespace Kind {
    export function intoCode(kind: Kind): types.SymbolKind {
      switch (kind) {
        case "Class": return types.SymbolKind.Class;
        case "Constructor": return types.SymbolKind.Constructor;
        case "Exn": return types.SymbolKind.Constructor;
        case "Label": return types.SymbolKind.Field;
        case "Method": return types.SymbolKind.Method;
        case "Modtype": return types.SymbolKind.Interface;
        case "Module": return types.SymbolKind.Module;
        case "Signature": return types.SymbolKind.Interface;
        case "Type": return types.SymbolKind.Class;
        case "Value": return types.SymbolKind.Variable;
        default: throw new Error(`<unreachable>: ${kind}`);
      }
    }
  }
  export type Item = {
    start: PositionColumnLine;
    end: PositionColumnLine;
    name: string;
    kind: Kind;
    children: Item[];
  };
  export function intoCode(outline: Item[], uri: string): types.SymbolInformation[] {
    const symbols: types.SymbolInformation[] = [];
    function traverse (children: Item[], scope: string): void {
      for (const item of children) {
        if (item) {
          const kind = Kind.intoCode(item.kind);
          const range = {
            end: Position.intoCode(item.end),
            start: Position.intoCode(item.start),
          };
          const thisParent = scope === "" ? undefined : scope;
          const nextParent = `${scope}${scope === "" ? "" : "."}${item.name}`;
          const info = types.SymbolInformation.create(item.name, kind, range, uri, thisParent);
          symbols.push(info);
          traverse(item.children, nextParent);
        }
      }
    }
    traverse(outline, "");
    return symbols;
  }
};
export type Outline = Outline.Item[];

export type TailPosition
  = "call"
  | "no"
  | "position"
  ;
export namespace TailPosition {
  export function intoCode(info: TailPosition): types.MarkedString {
    const language = "reason.hover.info";
    const position = (arg: string) => ({ language, value: `position: ${arg}` });
    switch (info) {
      case "call": return position("tail (call)");
      case "no": return position("normal");
      case "position": return position("tail");
      default: throw new Error(`<unreachable>: ${info}`);
    }
  }
}

export namespace Command {
  export class Query<I, O> {
    public query: I;
    constructor(query: I) {
      void undefined as any as O; // tslint:disable-line:no-unused-expression
      this.query = query;
      return this;
    }
  }
  export namespace Query {
    // case
    export namespace kase {
      export const analysis = {
        from: (start: Position) => ({
          to: (end: Position) => new Query<
            ["case", "analysis", "from", Position, "to", Position],
            Case.Destruct
          >(["case", "analysis", "from", start   , "to", end     ]),
        }),
      };
    }
    // complete
    export namespace complete {
      export const prefix = (pre: string) => ({
        at: (position: Position) => ({
          with: {
            doc: () => new Query<
              ["complete", "prefix", string, "at", Position, "with", "doc"],
              { entries?: Completion.Entry[] }
            >(["complete", "prefix", pre   , "at", position, "with", "doc"]),
          },
        }),
      });
    }
    // document
    export const document = (name: string | null) => ({
      at: (position: Position) => new Query<
        ["document", string | null, "at", Position],
        string
      >(["document", name         , "at", position]),
    });
    // dump
    export namespace dump {
      export namespace env {
        export const at = (position: Position) => new Query<
          ["dump", "env", "at", Position],
          JSONValue
        >(["dump", "env", "at", position]);
      }
    }
    // errors
    export const errors = () => new Query<
      ["errors"],
      ErrorReport[]
    >(["errors"]);
    // locate
    export const locate = (name: string | null, kind: "ml" | "mli") => ({
      at: (position: Position) => new Query<
        ["locate", string | null, ("ml" | "mli"), "at", Position],
        { file: string; pos: PositionColumnLine }
      >(["locate", name         , kind          , "at", position]),
    });
    // outline
    export const outline = () => new Query<
      ["outline"],
      Outline
    >(["outline"]);
    // type
    export namespace type {
      export const expression = (expr: string) => ({
        at: (position: Position) => new Query<
          ["type", "expression", string, "at", Position],
          string
        >(["type", "expression", expr  , "at", position]),
      });
      export namespace enclosing {
        export const at = (position: Position) => new Query<
          ["type", "enclosing", "at", Position],
          { start: Position; end: Position; type: string; tail: TailPosition }[]
        >(["type", "enclosing", "at", position]);
      }
    }
  }
  export class Sync<I, O> {
    public sync: I;
    constructor(sync: I) {
      void undefined as any as O; // tslint:disable-line:no-unused-expression
      this.sync = sync;
      return this;
    }
  }
  export namespace Sync {
    // protocol
    export namespace protocol {
      export namespace version {
        export const get = () => new Sync<
          ["protocol", "version"],
          { selected: number; latest: number; merlin: string }
        >(["protocol", "version"]);
        export const set = (version: number) => new Sync<
          ["protocol", "version", number],
          { selected: number; latest: number; merlin: string }
        >(["protocol", "version", version]);
      }
    }
    // tell
    export const tell = (startPos: Position, endPos: Position, source: string) => new Sync<
      ["tell", Position, Position, string],
      undefined
    >(["tell", startPos, endPos  , source]);
  }
}

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
  public query<I, O>(request: Command.Query<I, O>, path?: string): Response<O> {
    const context: ["auto", string] | undefined = path ? ["auto", path] : undefined;
    return this.question<I, MerlinResponse<O>>(request.query, context);
  }
  public sync<I, O>(request: Command.Sync<I, O>, path?: string): Response<O> {
    const context: ["auto", string] | undefined = path ? ["auto", path] : undefined;
    return this.question<I, MerlinResponse<O>>(request.sync, context);
  }
}

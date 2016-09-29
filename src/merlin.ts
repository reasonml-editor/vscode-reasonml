import * as child_process from 'child_process';
import * as readline from 'readline';
import * as server from 'vscode-languageserver';

/**
 * JSON data
 */

export interface JSONArray extends Array<JSONValue> {
}

export interface JSONObject {
  [key: string]: JSONValue;
}

export type JSONValue
  = boolean
  | JSONArray
  | JSONObject
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
  = 'start'
  | 'end'
  | number
  | PositionColumnLine
  ;
export namespace Position {
  export function fromCode({ character: col, line }: server.Position): PositionColumnLine {
    return { col, line: line + 1 };
  }
  export function intoCode({ col: character, line }: PositionColumnLine): server.Position {
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
  class: 'return';
  value: T;
  notifications: MerlinNotification;
} | {
  class: 'failure';
  value: string;
  notifications: MerlinNotification;
} | {
  class: 'error';
  value: string;
  notifications: MerlinNotification;
} | {
  class: 'exception';
  value: JSONValue;
  notifications: MerlinNotification;
};

export type Response<T> = Promise<MerlinResponse<T>>;

/**
 * Merlin command data
 */

export namespace Completion {
  export type Label = {
    name: string;
    type: string;
  };
  export type Context
    = null
    | ['application', { argument_type: string; labels: Label[] }];
  export type Kind
    = '#' | 'class' | 'constructor' | 'exn' | 'label' | 'method' | 'module' | 'signature' | 'type' | 'value' | 'variant';
  export namespace Kind {
    export function intoCode(kind: Kind): server.CompletionItemKind {
      let result: server.CompletionItemKind = server.CompletionItemKind.Value;
      switch (kind) {
        case '#':
          result = server.CompletionItemKind.Method;
          break;
        case 'class':
          result = server.CompletionItemKind.Class;
          break;
        case 'constructor':
          result = server.CompletionItemKind.Constructor;
          break;
        case 'exn':
          result = server.CompletionItemKind.Constructor;
          break;
        case 'label':
          result = server.CompletionItemKind.Field;
          break;
        case 'method':
          result = server.CompletionItemKind.Function;
          break;
        case 'module':
          result = server.CompletionItemKind.Module;
          break;
        case 'signature':
          result = server.CompletionItemKind.Interface;
          break;
        case 'type':
          result = server.CompletionItemKind.Class;
          break;
        case 'value':
          result = server.CompletionItemKind.Value;
          break;
        case 'variant':
          result = server.CompletionItemKind.Enum;
          break;
      }
      return result;
    }
  }
  export type Entry = {
    name: string;
    kind: Kind;
    desc: string;
    info: string;
  };
  export function intoCode({ name: label, kind, desc: detail, info: documentation }: Entry): server.CompletionItem {
    return { detail, documentation, label, kind: Kind.intoCode(kind) }
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
  = 'env'
  | 'parser'
  | 'type'
  | 'unknown'
  | 'warning'
  ;
  export namespace Type {
    export function intoCode(type: Type): server.DiagnosticSeverity {
      switch (type) {
        case 'env': return server.DiagnosticSeverity.Error;
        case 'parser': return server.DiagnosticSeverity.Error;
        case 'type': return server.DiagnosticSeverity.Error;
        case 'unknown': return server.DiagnosticSeverity.Error;
        case 'warning': return server.DiagnosticSeverity.Warning;
        default: throw new Error(`<unreachable>: ${type}`);
      }
    }
  }
  export function intoCode(report: ErrorReport): server.Diagnostic {
    const range = {
      start: Position.intoCode(report.start),
      end: Position.intoCode(report.end),
    };
    const message = report.message;
    const severity = Type.intoCode(report.type);
    const codeMatch = /^Warning\s*(\d+)?:/.exec(report.message);
    const code = codeMatch && codeMatch.length > 1 ? codeMatch[1] : '';
    const source = 'merlin';
    return server.Diagnostic.create(range, message, severity, code, source);
  }
}

export namespace Outline {
  export type Kind
    = 'Class'
    | 'Constructor'
    | 'Exn'
    | 'Label'
    | 'Method'
    | 'Modtype'
    | 'Module'
    | 'Type'
    | 'Value'
    ;
  export namespace Kind {
    export function intoCode(kind: Kind): server.SymbolKind {
      switch (kind) {
        case 'Class': return server.SymbolKind.Class;
        case 'Constructor': return server.SymbolKind.Constructor;
        case 'Exn': return server.SymbolKind.Constructor;
        case 'Label': return server.SymbolKind.Field;
        case 'Method': return server.SymbolKind.Method;
        case 'Modtype': return server.SymbolKind.Interface;
        case 'Module': return server.SymbolKind.Module;
        case 'Signature': return server.SymbolKind.Interface;
        case 'Type': return server.SymbolKind.Class;
        case 'Value': return server.SymbolKind.Variable;
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
  export function intoCode(outline: Item[], uri: string): server.SymbolInformation[] {
    const symbols: server.SymbolInformation[] = [];
    function traverse (children: Item[], scope: string): void {
      for (const item of children) {
        if (item) {
          const kind = Kind.intoCode(item.kind);
          const range = {
            start: Position.intoCode(item.start),
            end: Position.intoCode(item.end),
          };
          const thisParent = scope === '' ? undefined : scope;
          const nextParent = `${scope}${scope === '' ? '' : '.'}${item.name}`;
          const info = server.SymbolInformation.create(item.name, kind, range, uri, thisParent);
          symbols.push(info);
          traverse(item.children, nextParent);
        }
      }
    }
    traverse(outline, '');
    return symbols;
  }
};
export type Outline = Outline.Item[];

export type TailPosition
  = 'call'
  | 'no'
  | 'position'
  ;
export namespace TailPosition {
  export function intoCode(info: TailPosition): server.MarkedString {
    const language = 'reason.hover.info';
    const position = (arg: string) => ({ language, value: `position: ${arg}` });
    switch (info) {
      case 'call': return position('tail (call)');
      case 'no': return position('normal');
      case 'position': return position('tail');
      default: throw new Error(`<unreachable>: ${info}`);
    }
  }
}

export namespace Command {
  export class Query<I, O> {
    query: I;
    constructor(query: I) {
      void undefined as any as O;
      this.query = query;
      return this;
    }
  }
  export namespace Query {
    // complete
    export namespace complete {
      export const prefix = (prefix: string) => ({
        at: (position: Position) => ({
          with: {
            doc: () => new Query<
              ['complete', 'prefix', string, 'at', Position, 'with', 'doc'],
              { entries?: Completion.Entry[] }
            >(['complete', 'prefix', prefix, 'at', position, 'with', 'doc']),
          },
        }),
      });
    }
    // dump
    export namespace dump {
      export namespace env {
        export const at = (position: Position) => new Query<
          ['dump', 'env', 'at', Position],
          JSONValue
        >(['dump', 'env', 'at', position]);
      }
    }
    // errors
    export const errors = () => new Query<
      ['errors'],
      ErrorReport[]
    >(['errors']);
    // outline
    export const outline = () => new Query<
      ['outline'],
      Outline
    >(['outline']);
    // type
    export namespace type {
      export const expression = (expr: string) => ({
        at: (position: Position) => new Query<
          ['type', 'expression', string, 'at', Position],
          string
        >(['type', 'expression', expr  , 'at', position]),
      });
      export namespace enclosing {
        export const at = (position: Position) => new Query<
          ['type', 'enclosing', 'at', Position],
          { start: Position; end: Position; type: string; tail: TailPosition }[]
        >(['type', 'enclosing', 'at', position]);
      }
    }
  }
  export class Sync<I, O> {
    sync: I;
    constructor(sync: I) {
      void undefined as any as O;
      this.sync = sync;
      return this;
    }
  }
  export namespace Sync {
    // protocol
    export namespace protocol {
      export namespace version {
        export const get = () => new Sync<
          ['protocol', 'version'],
          { selected: number; latest: number; merlin: string }
        >(['protocol', 'version']);
        export const set = (version: number) => new Sync<
          ['protocol', 'version', number],
          { selected: number; latest: number; merlin: string }
        >(['protocol', 'version', version]);
      }
    }
    // tell
    export const tell = (startPos: Position, endPos: Position, source: string) => new Sync<
      ['tell', Position, Position, string],
      undefined
    >(['tell', startPos, endPos  , source]);
  }
}

export class Session {
  private _process: child_process.ChildProcess;
  private _readline: readline.ReadLine;
  constructor() {
    this._process = child_process.spawn('ocamlmerlin', []);
    this._readline = readline.createInterface({
      input: this._process.stdout,
      output: this._process.stdin,
      terminal: false,
    });
  }
  dispose() {
    this._readline.close();
    this._process.disconnect();
  }
  question<I, O>(query: I, context?: ['auto', string]): Promise<O> {
    const request = context ? { context, query } : query;
    return new Promise((resolve) => {
      this._readline.question(JSON.stringify(request), (answer) => {
        resolve(JSON.parse(answer));
      });
    });
  }
  query<I, O>(request: Command.Query<I, O>, path?: string): Response<O> {
    const context: ['auto', string] | undefined = path ? ['auto', path] : undefined;
    return this.question<I, MerlinResponse<O>>(request.query, context);
  }
  sync<I, O>(request: Command.Sync<I, O>, path?: string): Response<O> {
    const context: ['auto', string] | undefined = path ? ['auto', path] : undefined;
    return this.question<I, MerlinResponse<O>>(request.sync, context);
  }
}

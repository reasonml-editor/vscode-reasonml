import * as child_process from 'child_process';
import * as readline from 'readline';

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

export namespace Context {
  export type document = any;
}

export namespace Completion {
  export type Label = {
    name: string;
    type: string;
  };
  export type Context
    = null
    | ['application', { argument_type: string; labels: Label[] }];
  export type Entry = {
    name: string;
    kind: '#' | 'class' | 'constructor' | 'exn' | 'label' | 'method' | 'module' | 'signature' | 'type' | 'value' | 'variant';
    desc: string;
    info: string;
  };
}

export type ErrorEntry = {
  start?: Position;
  end?: Position;
  valid: boolean;
  message: string;
  type: 'env' | 'parser' | 'type' | 'unknown' | 'warning'
};

export type Position
  = 'start'
  | 'end'
  | number
  | { 'line': number; 'col': number }
  ;

export type Location = {
  start: Position;
  end: Position;
};

export namespace Data {
  export type TailPosition
    = 'call'
    | 'no'
    | 'position'
    ;
}

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

export namespace Command {
  export class Query<I, O> {
    data: I;
    constructor(data: I) {
      void undefined as any as O;
      this.data = data;
      return this;
    }
  };
  export namespace Query {
    export function caseAnalysis(startPos: Position, endPos: Position) {
      return new Query<[Position, Position], [Location, string]>([startPos, endPos]);
    }
  }
  export class Sync<I, O> {
    data: I;
    constructor(data: I) {
      void undefined as any as O;
      this.data = data;
      return this;
    }
  };
  export namespace Sync {
    export namespace protocol {
      export namespace version {
        export function get() {
          return new Sync<['protocol', 'version'], { selected: number; latest: number; merlin: string }>(
            ['protocol', 'version']
          );
        }
        export function set(version: number) {
          return new Sync<['protocol', 'version', number], { selected: number; latest: number; merlin: string }>(
            ['protocol', 'version', version]
          );
        }
      }
    }
    export function tell(startPos: Position, endPos: Position, source: string) {
      return new Sync<['tell', Position, Position, string], undefined>(
        ['tell', startPos, endPos, source]
      );
    }
    export namespace type {
      export namespace expression {
        export function at(expr: string, pos: Position) {
          return new Sync<
            ['type', 'expression', string, 'at', Position],
            { start: Position; end: Position; type: string; tail: 'call' | 'no' | 'position' }
          >(
            ['type', 'expression', expr, 'at', pos]
          );
        }
      }
      export namespace enclosing {
        export function at(pos: Position) {
          return new Sync<
            ['type', 'enclosing', 'at', Position],
            { start: Position; end: Position; type: string; tail: 'call' | 'no' | 'position' }[]
          >(
            ['type', 'enclosing', 'at', pos]
          );
        }
      }
    }
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
    return this.question<I, MerlinResponse<O>>(request.data, context);
  }
  sync<I, O>(request: Command.Sync<I, O>, path?: string): Response<O> {
    const context: ['auto', string] | undefined = path ? ['auto', path] : undefined;
    return this.question<I, MerlinResponse<O>>(request.data, context);
  }
}

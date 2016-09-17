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

export namespace Merlin {
  export namespace Protocol {
    export namespace V3 {
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
          | ['application', {
            argument_type: string;
            labels: Label[];
          }];
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
      export namespace Kind {
        export namespace Query {
          export type CaseAnalysis = [Location, string];
          export type CompletePrefix = {
            context: Completion.Context;
            entries: Completion.Entry[];
          };
          export type Document = string;
          export type Dump = JSONObject;
          export type Enclosing = Location[];
          export type Errors = ErrorEntry[];
          export type ExpandPrefix = {
            context: Completion.Context;
            entries: Completion.Entry[];
          };
          export type ExtensionList = string[];
          export type FindlibList = string[];
          export type FlagsGet = string[];
          export type IdleJob = any;
          export type Jump
            = Position
            | string
          export type Locate
            = { file?: string; pos: Position }
            | string ;
          export type Occurrences = Position[];
          export type Outline = {
            start: Position;
            end: Position;
            name: string;
            kind: string;
            children: Outline[];
          };
          export type PathList = string[];
          export type ProjectGet = {
            result: string[];
            failures: string[];
          };
          export type Shape = any;
          export type TypeEnclosing = {
            start: Position;
            end: Position;
            type: string;
            tail: Data.TailPosition;
          };
          export type TypeExpr = string;
          export type Version = string;
          export type WhichPath = string;
          export type WhichWithExt = string[];
        }
        export namespace Sync {
          export type Checkout = any;
          export type ExtensionSet = {
            failures?: string[];
            result: undefined;
          };
          export type FindlibUse = {
            failures?: string[];
            result: undefined;
          };
          export type FlagsSet = {
            failures?: string[];
            result: undefined;
          };
          export type Path = undefined;
          export type PathReset = undefined;
          export type ProtocolVersion = {
            selected: number;
            latest: number;
            merlin: string;
          };
          export type Refresh = undefined;
          export type Tell = undefined;
        }
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
        export interface Query {
          caseAnalysis(startPos: Position, endPos: Position): Response<Kind.Query.CaseAnalysis>;
          completePrefix(prefix: string, pos: Position): Response<Kind.Query.CompletePrefix>;
          completePrefixWithDoc(prefix: string, pos: Position): Response<Kind.Query.CompletePrefix>;
          document(id: string, pos: Position): Response<Kind.Query.Document>;
          document(pos: Position): Response<Kind.Query.Document>;
          dumpBrowse(): Response<Kind.Query.Dump>;
          dumpEnv(): Response<Kind.Query.Dump>;
          dumpEnv(pos: Position): Response<Kind.Query.Dump>;
          dumpEnvFull(): Response<Kind.Query.Dump>;
          dumpEnvFull(pos: Position): Response<Kind.Query.Dump>;
          dumpFlags(): Response<Kind.Query.Dump>;
          dumpParser(): Response<Kind.Query.Dump>;
          dumpRecover(): Response<Kind.Query.Dump>;
          dumpSig(): Response<Kind.Query.Dump>;
          dumpTokens(): Response<Kind.Query.Dump>;
          dumpTyperInput(): Response<Kind.Query.Dump>;
          dumpTyperOutput(): Response<Kind.Query.Dump>;
          dumpWarnings(): Response<Kind.Query.Dump>;
          enclosing(pos: Position): Response<Kind.Query.Enclosing>;
          errors(): Response<Kind.Query.Errors>;
          expandPrefix(prefix: string, pos: Position): Response<Kind.Query.ExpandPrefix>;
          extensionList(): Response<Kind.Query.ExtensionList>;
          extensionListEnabled(): Response<Kind.Query.ExtensionList>;
          extensionList(): Response<Kind.Query.ExtensionList>;
          findlibList(): Response<Kind.Query.FindlibList>;
          flagsGet(): Response<Kind.Query.FlagsGet>;
          idleJob(): Response<Kind.Query.IdleJob>;
          jump(id: string, pos: Position): void;
          locate(id: string, kind: 'ml' , pos: Position): Response<Kind.Query.Locate>;
          locate(id: string, kind: 'mli', pos: Position): Response<Kind.Query.Locate>;
          occurrences(): Response<Kind.Query.Occurrences>;
          outline(): Response<Kind.Query.Outline>;
          pathList(): Response<Kind.Query.PathList>;
          projectGet(): Response<Kind.Query.ProjectGet>;
          shape(): Response<Kind.Query.Shape>;
          typeEnclosing(expr: string, offset: number, pos: Position): Response<Kind.Query.TypeEnclosing>;
          typeEnclosing(pos: Position): Response<Kind.Query.TypeEnclosing>;
          typeExpr(expr: string, pos: Position): Response<Kind.Query.TypeExpr>;
          version(): Response<Kind.Query.Version>;
          whichPath(): Response<Kind.Query.WhichPath>;
          whichWithExt(): Response<Kind.Query.WhichWithExt>;
        }
        export interface Sync {
          checkout(): Response<Kind.Sync.Checkout>;
          extensionEnable(exts: string[]): Response<Kind.Sync.ExtensionSet>;
          extensionEnable(exts: string[]): Response<Kind.Sync.ExtensionSet>;
          findlibUse(packages: string[]): Response<Kind.Sync.FindlibUse>;
          flagsSet(flags: string[]): Response<Kind.Sync.FlagsSet>;
          pathReset(): Response<Kind.Sync.PathReset>;
          protocolVersion(): Response<Kind.Sync.ProtocolVersion>;
          refresh(): Response<Kind.Sync.Refresh>;
          tell(startPos: Position, endPos: Position, code: string): Response<Kind.Sync.Tell>;
        }
      }
    }
  }
  export class Session {
    constructor() {
    }
  }
}

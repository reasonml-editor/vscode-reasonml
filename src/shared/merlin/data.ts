import * as types from "vscode-languageserver-types";
import * as ordinal from "./ordinal";
import * as remote from "../remote";

export namespace Case {
  export type Destruct = [{ end: ordinal.ColumnLine; start: ordinal.ColumnLine }, string];
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
    return {
      data: {
        documentation,
      },
      detail,
      label,
      kind: Kind.intoCode(kind),
    };
  }
}

export type ErrorReport = {
  start: ordinal.ColumnLine;
  end: ordinal.ColumnLine;
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
  async function improveMessage(session: any, { uri, range  }: types.Location, original: string): Promise<string> {
    if (original === "Invalid statement") {
      const location = types.Location.create(uri, range);
      const text = await session.connection.sendRequest(remote.client.giveText, location);
      if (text === "=") {
        return "Functions must be defined with => instead of the = symbol.";
      }
    }
    if (original === "Statement has to end with a semicolon") {
      return "Statements must be terminated with a semicolon.";
    }
    return original;
  }
  function getCode(message: string): string {
    const codeMatch = /^Warning\s*(\d+)?:/.exec(message);
    return codeMatch && codeMatch.length > 1 ? codeMatch[1] : "";
  }
  export async function intoCode(session: any, { uri }: types.TextDocumentIdentifier, { end, message: original, start, type }: ErrorReport): Promise<types.Diagnostic> {
    const range = {
      end: ordinal.Position.intoCode(end),
      start: ordinal.Position.intoCode(start),
    };
    const location = { range, uri };
    const message = await improveMessage(session, location, original);
    const code = getCode(original);
    const severity = Type.intoCode(type);
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
    | "Signature" // FIXME
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
    start: ordinal.ColumnLine;
    end: ordinal.ColumnLine;
    name: string;
    kind: Kind;
    children: Item[];
  };
  export function intoCode(outline: Item[], id: types.TextDocumentIdentifier): types.SymbolInformation[] {
    const symbols: types.SymbolInformation[] = [];
    function traverse (children: Item[], scope: string): void {
      for (const item of children) {
        if (item) {
          const kind = Kind.intoCode(item.kind);
          const range = {
            end: ordinal.Position.intoCode(item.end),
            start: ordinal.Position.intoCode(item.start),
          };
          const thisParent = scope === "" ? undefined : scope;
          const nextParent = `${scope}${scope === "" ? "" : "."}${item.name}`;
          const info = types.SymbolInformation.create(item.name, kind, range, id.uri, thisParent);
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

export type Type = {
  start: ordinal.Position;
  end: ordinal.Position;
  type: string;
  tail: TailPosition;
};

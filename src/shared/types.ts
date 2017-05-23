import * as types from "vscode-languageserver-types";

export interface ILocatedPosition {
  position: types.Position;
  uri: string;
}
export namespace LocatedPosition {
  export function create(uri: string, position: types.Position): ILocatedPosition {
    return { position, uri };
  }
}

export type LocatedRange = types.Location;

export interface ITextDocumentRange {
  range: types.Range;
  textDocument: types.TextDocumentIdentifier;
}

export interface ITextDocumentData {
  content: string;
  languageId: string;
  version: number;
}

export interface IUnformattedTextDocument {
  uri: string;
  languageId: string;
  version: number;
  content: string;
}

export * from "vscode-languageserver-types";

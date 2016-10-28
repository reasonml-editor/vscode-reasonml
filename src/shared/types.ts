import * as types from "vscode-languageserver-types";

export interface LocatedPosition {
  position: types.Position;
  uri: string;
};
export namespace LocatedPosition {
  export function create(uri: string, position: types.Position): LocatedPosition {
    return { position, uri };
  }
}

export type LocatedRange = types.Location;

export type TextDocumentRange = {
  range: types.Range;
  textDocument: types.TextDocumentIdentifier;
};

export type TextDocumentData = {
  content: string;
  languageId: string;
  version: number;
};

export * from "vscode-languageserver-types";

import * as types from "vscode-languageserver-types";

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

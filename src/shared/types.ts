import * as types from "vscode-languageserver-types";

export type DocumentRange = {
  range: types.Range,
  textDocument: { uri: string },
};

export * from "vscode-languageserver-types";

import * as ordinal from "./ordinal";
import * as types from "vscode-languageserver-types";

export type ColumnLine = {
  col: number;
  line: number;
}

export type Position
  = "start"
  | "end"
  | number
  | ordinal.ColumnLine
  ;
export namespace Position {
  export function fromCode({ character: col, line }: types.Position): ordinal.ColumnLine {
    return { col, line: line + 1 };
  }
  export function intoCode({ col: character, line }: ordinal.ColumnLine): types.Position {
    return { character, line: line - 1 };
  }
}

export type Location = {
  start: Position;
  end: Position;
};

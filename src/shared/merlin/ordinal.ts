import * as types from "vscode-languageserver-types";

export type ColumnLine = {
  col: number;
  line: number;
}

export type Position
  = "start"
  | "end"
  | number
  | ColumnLine
  ;
export namespace Position {
  export function fromCode({ character: col, line }: types.Position): ColumnLine {
    return { col, line: line + 1 };
  }
  export function intoCode({ col: character, line }: ColumnLine): types.Position {
    return { character, line: line - 1 };
  }
}

export type Location = {
  start: Position;
  end: Position;
};

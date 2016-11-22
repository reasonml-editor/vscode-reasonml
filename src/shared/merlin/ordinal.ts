import * as types from "vscode-languageserver-types";

export type ColumnLine = {
  col: number;
  line: number;
};

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
  start: ColumnLine;
  end: ColumnLine;
};
export namespace Location {
  export function fromCode(range: types.Range): Location {
    const start = Position.fromCode(range.start);
    const end = Position.fromCode(range.end);
    return { start, end };
  }
  export function intoCode(location: Location): types.Range {
    const start = Position.intoCode(location.start);
    const end = Position.intoCode(location.end);
    return { start, end };
  }
}

import * as types from "vscode-languageserver-types";

export interface IColumnLine {
  col: number;
  line: number;
}

export type Position
  = "start"
  | "end"
  | number
  | IColumnLine
  ;
export namespace Position {
  export function fromCode({ character: col, line }: types.Position): IColumnLine {
    return { col, line: line + 1 };
  }
  export function intoCode({ col: character, line }: IColumnLine): types.Position {
    return { character, line: line - 1 };
  }
}

export interface ILocation {
  start: IColumnLine;
  end: IColumnLine;
}
export namespace Location {
  export function fromCode(range: types.Range): ILocation {
    const start = Position.fromCode(range.start);
    const end = Position.fromCode(range.end);
    return { start, end };
  }
  export function intoCode(location: ILocation): types.Range {
    const start = Position.intoCode(location.start);
    const end = Position.intoCode(location.end);
    return { start, end };
  }
}

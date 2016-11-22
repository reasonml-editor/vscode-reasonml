// tslint:disable trailing-comma

import * as data from "../data";
import * as json from "../json";
import { ColumnLine, Location, Position } from "../ordinal";

export class Query<I, O> {
  public query: I;
  constructor(query: I) {
    void null as any as O; // tslint:disable-line:no-unused-expression
    this.query = query;
    return this;
  }
}

export namespace Query {
  // case
  export namespace kase {
    export const analysis = {
      from: (start: Position) => ({
        to: (end: Position) => new Query<
          ["case", "analysis", "from", Position, "to", Position], data.Case.Destruct
        >(["case", "analysis", "from", start, "to", end]),
      }),
    };
  }

  // complete
  export namespace complete {
    export const prefix = (text: string) => ({
      at: (position: Position) => ({
        with: {
          doc: () => new Query<
            ["complete", "prefix", string, "at", Position, "with", "doc"], { entries?: data.Completion.Entry[] }
          >(["complete", "prefix", text  , "at", position, "with", "doc"]),
        },
      }),
    });
  }

  // document
  export const document = (name: null | string) => ({
    at: (position: Position) => new Query<
      ["document", null | string, "at", Position], string
    >(["document", name , "at", position]),
  });

  // dump
  export namespace dump {
    export namespace env {
      export const at = (position: Position) => new Query<
        ["dump", "env", "at", Position], json.Value
      >(["dump", "env", "at", position]);
    }
  }

  // enclosing
  export const enclosing = (position: Position) => new Query<
    ["enclosing", Position], Location[]
  >(["enclosing", position]);

  // errors
  export const errors = () => new Query<["errors"], data.ErrorReport[]>(["errors"]);

  // locate
  export const locate = (name: null | string, kind: "ml" | "mli") => ({
    at: (position: Position) => new Query<
      ["locate", null | string, ("ml" | "mli"), "at", Position], { file: string; pos: ColumnLine }
    >(["locate", name         , kind          , "at", position]),
  });

  // occurrences
  export namespace occurrences {
    export namespace ident {
      export const at = (position: Position) => new Query<
        ["occurrences", "ident", "at", Position], Location[]
      >(["occurrences", "ident", "at", position]);
    }
  }

  // outline
  export const outline = () => new Query<["outline"], data.Outline>(["outline"]);

  // path
  export namespace path {
    export namespace list {
      export const source = () => new Query<
        ["path", "list", "source"], string[]
      >(["path", "list", "source"]);
    }
  }

  // project
  export namespace project {
    export const get = () => new Query<
      ["project", "get"], { result: string[] }
    >(["project", "get"]);
  }

  // type
  export namespace type {
    export const expression = (expr: string) => ({
      at: (position: Position) => new Query<
        ["type", "expression", string, "at", Position], string
      >(["type", "expression", expr  , "at", position]),
    });
    export namespace enclosing {
      export const at = (position: Position) => new Query<
        ["type", "enclosing", "at", Position], data.Type[]
      >(["type", "enclosing", "at", position]);
    }
  }
}

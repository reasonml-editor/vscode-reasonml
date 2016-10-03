import * as data from "../data";
import * as json from "../json";
import * as ordinal from "../ordinal";

export class Query<I, O> {
  query: I;
  constructor(query: I) {
    void undefined as any as O; // tslint:disable-line:no-unused-expression
    this.query = query;
    return this;
  }
}

export namespace Query {
  // case
  export namespace kase {
    export const analysis = {
      from: (start: ordinal.Position) => ({
        to: (end: ordinal.Position) => new Query<
          ["case", "analysis", "from", ordinal.Position, "to", ordinal.Position],
          data.Case.Destruct
          >(["case", "analysis", "from", start, "to", end]),
      }),
    };
  }

  // complete
  export namespace complete {
    export const prefix = (pre: string) => ({
      at: (position: ordinal.Position) => ({
        with: {
          doc: () => new Query<
            ["complete", "prefix", string, "at", ordinal.Position, "with", "doc"],
            { entries?: data.Completion.Entry[] }
            >(["complete", "prefix", pre, "at", position, "with", "doc"]),
        },
      }),
    });
  }

  // document
  export const document = (name: string | null) => ({
    at: (position: ordinal.Position) => new Query<
      ["document", string | null, "at", ordinal.Position],
      string
      >(["document", name, "at", position]),
  });

  // dump
  export namespace dump {
    export namespace env {
      export const at = (position: ordinal.Position) => new Query<
        ["dump", "env", "at", ordinal.Position],
        json.Value
        >(["dump", "env", "at", position]);
    }
  }

  // errors
  export const errors = () => new Query<["errors"], data.ErrorReport[]>(["errors"]);

  // locate
  export const locate = (name: string | null, kind: "ml" | "mli") => ({
    at: (position: ordinal.Position) => new Query<
      ["locate", string | null, ("ml" | "mli"), "at", ordinal.Position],
      { file: string; pos: ordinal.ColumnLine }
      >(["locate", name, kind, "at", position]),
  });

  // outline
  export const outline = () => new Query<["outline"], data.Outline>(["outline"]);

  // type
  export namespace type {
    export const expression = (expr: string) => ({
      at: (position: ordinal.Position) => new Query<
        ["type", "expression", string, "at", ordinal.Position],
        string
        >(["type", "expression", expr, "at", position]),
    });
    export namespace enclosing {
      export const at = (position: ordinal.Position) => new Query<
        ["type", "enclosing", "at", ordinal.Position],
        { start: ordinal.Position; end: ordinal.Position; type: string; tail: data.TailPosition }[]
        >(["type", "enclosing", "at", position]);
    }
  }
}

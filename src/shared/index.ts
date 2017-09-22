import * as merlin from "./merlin";
import * as parser from "./parser";
import * as remote from "./remote";
import * as types from "./types";

export interface ISettings {
  reason: {
    bsb: {
      enabled: boolean;
    };
    codelens: {
      enabled: boolean;
      unicode: boolean;
    };
    debounce: {
      linter: number;
    };
    path: {
      bsb: string;
      ocamlfind: string;
      ocamlmerlin: string;
      opam: string;
      rebuild: string;
      refmt: string;
      refmterr: string;
      rtop: string;
    };
    server: {
      languages: Array<"ocaml" | "reason">;
    };
  };
}
export namespace ISettings {
  export const defaults: ISettings = {
    reason: {
      bsb: {
        enabled: false,
      },
      codelens: {
        enabled: true,
        unicode: true,
      },
      debounce: {
        linter: 500,
      },
      path: {
        bsb: "bsb",
        ocamlfind: "ocamlfind",
        ocamlmerlin: "ocamlmerlin",
        opam: "opam",
        rebuild: "rebuild",
        refmt: "refmt",
        refmterr: "refmterr",
        rtop: "rtop",
      },
      server: {
        languages: [
          "ocaml",
          "reason",
        ],
      },
    },
  };
}

export {
  merlin,
  parser,
  remote,
  types,
};

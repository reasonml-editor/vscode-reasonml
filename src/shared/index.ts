import * as merlin from "./merlin";
import * as parser from "./parser";
import * as remote from "./remote";
import * as types from "./types";

/**
 * Structured configuration settings for the session.
 */
export interface ISettings {
  reason: {
    codelens: {
      unicode: boolean;
    };
    debounce: {
      linter: number;
    };
    path: {
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

export {
  merlin,
  parser,
  remote,
  types,
};

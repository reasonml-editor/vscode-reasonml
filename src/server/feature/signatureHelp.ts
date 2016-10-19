import { merlin, parser, /* remote,*/ types } from "../../shared";
import * as command from "../command";
import Session from "../session";
import * as server from "vscode-languageserver";

namespace Syntax {
  type Boundary
    = "(" | ")"
    | "[" | "]"
    | "{" | "}"
    ;

  type State
    = { type: "char" }
    | { type: "comment", depth: number }
    | { type: "label" }
    | { type: "space" }
    | { type: "spine" }
    | { type: "string" }
    ;

  export namespace Application {
    export type Head = {
      start: number;
      end: number;
      distance: number;
    };
    export namespace Head {

      export function locate(_: Session, text: string, offset: number): null | Head {
        let start = offset;
        let end = 0;
        let stack: Boundary[] = [];
        let state: State = { type: "spine" };
        let distance = 0;

        // scan backward…
        while (0 < start--) {

          // descend into comments
          if (text[start - 0] === "/")
            if (text[start - 1] === "*") {
              if (state.type === "comment") {
                state.depth += 1;
              } else {
                state = { depth: 0, type: "comment" };
              }
              start -= 2;
            }

          if (text[start - 0] === "*")
            if (text[start - 1] === "/") {
              if (state.type === "comment" && state.depth > 0) {
                state.depth -= 1;
              } else {
                state = { type: "spine" };
              }
              start -= 2;
            }

          // skip everything except closing tokens while parsing comments
          if ((state.type as any) === "comment") continue;

          // descend into characters
          if (text[start] === "'" && text[--start] !== "\\") {
            if (state.type !== "char") {
              state = { type: "char" };
            } else {
              state = { type: "spine" };
            }
          }

          // descend into strings
          if (text[start] === "\"" && text[--start] !== "\\") {
            if (state.type !== "string") {
              state = { type: "string" };
            } else {
              state = { type: "spine"};
            }
          }

          // skip everything except char/string closing tokens while parsing chars/strings
          if ((state.type as any) === "char") continue;
          if ((state.type as any) === "string") continue;

          // when in the top-most context…
          if (stack.length === 0) {
            // stop on ";"
            if (text[start] === ";") break;

            // stop on ","
            if (text[start] === ",") break;

            // stop on "..."
            if (text[start - 0] === ".")
              if (/[ \f\n\r\t\v]|[^#\-:!?@*/&%^+<=>|~$\\\\]/.test(text[start - 1])) {
                start -= 1;
                continue;
              } else {
                start += 1;
                break;
              }

            // don't treat labels as boundaries
            if (text[start - 0] === "?")
              if (text[start - 1] === ":")
                if (text[start - 2] === ":")
                  if (/[ \f\n\r\t\v]|[^#\-:!?@*/&%^+<=>|~$\\\\]/.test(text[start - 3])) {
                    state = { type: "spine" };
                    start -= 3;
                    continue;
                  }

            // don't treat labels as boundaries
            if (text[start - 0] === ":")
              if (text[start - 1] === ":")
                if (/[ \f\n\r\t\v]|[^#\-:!?@*/&%^+<=>|~$\\\\]/.test(text[start - 2])) {
                  state = { type: "spine" };
                  start -= 2;
                  continue;
                }

            // stop on operators
            if (/[#\-:!?.@*/&%^+<=>|~$\\\\]/.test(text[start])) {
              start += 1;
              break;
            }

            // return nothing on "and" (bad context)
            if (text[start - 0] === "d")
              if (/[ \f\n\r\t\v]/.test(text[start + 1]))
                if (text[start - 1] === "n")
                  if (text[start - 2] === "a")
                    if (/^|[ \f\n\r\t\v]/.test(text[start - 3])) {
                      return null;
                    }

            // return nothing on "fun" (bad context)
            if (text[start - 0] === "n")
              if (/[ \f\n\r\t\v]/.test(text[start + 1]))
                if (text[start - 1] === "u")
                  if (text[start - 2] === "f")
                    if (/^|[ \f\n\r\t\v]/.test(text[start - 3])) {
                      return null;
                    }

            // return nothing on "include" (bad context)
            if (text[start - 0] === "e")
              if (/[ \f\n\r\t\v]/.test(text[start + 1]))
                if (text[start - 1] === "d")
                  if (text[start - 2] === "u")
                    if (text[start - 3] === "l")
                      if (text[start - 4] === "c")
                        if (text[start - 5] === "n")
                          if (text[start - 6] === "i")
                            if (/^|[ \f\n\r\t\v]/.test(text[start - 7]))
                              return null;

            // return nothing on "let" (bad context)
            if (text[start - 0] === "t")
              if (/[ \f\n\r\t\v]/.test(text[start + 1]))
                if (text[start - 1] === "e")
                  if (text[start - 2] === "l")
                    if (/^|[ \f\n\r\t\v]/.test(text[start - 3]))
                      return null;

            // return nothing on "module" (bad context)
            if (text[start - 0] === "e")
              if (/[ \f\n\r\t\v]/.test(text[start + 1]))
                if (text[start - 1] === "l")
                  if (text[start - 2] === "u")
                    if (text[start - 3] === "d")
                      if (text[start - 4] === "o")
                        if (text[start - 5] === "m")
                          if (/^|[ \f\n\r\t\v]/.test(text[start - 6]))
                            return null;

            // return nothing on "method" (bad context)
            if (text[start - 0] === "d")
              if (/[ \f\n\r\t\v]/.test(text[start + 1]))
                if (text[start - 1] === "o")
                  if (text[start - 2] === "h")
                    if (text[start - 3] === "t")
                      if (text[start - 4] === "e")
                        if (text[start - 5] === "m")
                          if (/^|[ \f\n\r\t\v]/.test(text[start - 6]))
                            return null;

            // return nothing on "open" (bad context)
            if (text[start - 0] === "n")
              if (/[ \f\n\r\t\v]/.test(text[start + 1]))
                if (text[start - 1] === "e")
                  if (text[start - 2] === "p")
                    if (text[start - 3] === "o")
                      if (/^|[ \f\n\r\t\v]/.test(text[start - 4]))
                        return null;

            // return nothing on "rec" (bad context)
            if (text[start - 0] === "c")
              if (/[ \f\n\r\t\v]/.test(text[start + 1]))
                if (text[start - 1] === "e")
                  if (text[start - 2] === "r")
                    if (/^|[ \f\n\r\t\v]/.test(text[start - 3]))
                      return null;

            // return nothing on "switch" (bad context)
            if (text[start - 0] === "h")
              if (/[ \f\n\r\t\v]/.test(text[start + 1]))
                if (text[start - 1] === "c")
                  if (text[start - 2] === "t")
                    if (text[start - 3] === "i")
                      if (text[start - 4] === "w")
                        if (text[start - 5] === "s")
                          if (/^|[ \f\n\r\t\v]/.test(text[start - 6]))
                            return null;

            // return nothing on "type" (bad context)
            if (text[start - 0] === "e")
              if (/[ \f\n\r\t\v]/.test(text[start + 1]))
                if (text[start - 1] === "p")
                  if (text[start - 2] === "y")
                    if (text[start - 3] === "t")
                      if (/^|[ \f\n\r\t\v]/.test(text[start - 4]))
                        return null;

            // return nothing on "val" (bad context)
            if (text[start - 0] === "l")
              if (/[ \f\n\r\t\v]/.test(text[start + 1]))
                if (text[start - 1] === "a")
                  if (text[start - 2] === "v")
                    if (/^|[ \f\n\r\t\v]/.test(text[start - 3]))
                      return null;

            // return nothing on "with" (bad context)
            if (text[start - 0] === "h")
              if (/[ \f\n\r\t\v]/.test(text[start + 1]))
                if (text[start - 1] === "t")
                  if (text[start - 2] === "i")
                    if (text[start - 3] === "w")
                      if (/^|[ \f\n\r\t\v]/.test(text[start - 4]))
                        return null;

            // on space->non-space, increment distance and disable space mode
            if (!/[ \f\n\r\t\v\(\[\{]/.test(text[start])) {
              if (state.type === "space") {
                end = start + 1;
                distance++;
              }
              state = { type: "spine" };
            }

            // on space, enable space mode
            if (/[ \f\n\r\t\v]/.test(text[start])) state = { type: "space" };
          }

          // descend into parentheses
          if (text[start] === ")") stack.push(")");
          if (text[start] === "(") {
            if (stack.length === 0) break;
            if (stack.pop() !== ")") return null;
          }

          // descend into square brackets
          if (text[start] === "]") stack.push("]");
          if (text[start] === "[") {
            if (stack.length === 0) break;
            if (stack.pop() !== "]") return null;
          }

          // descend into curly brackets
          if (text[start] === "}") stack.push("}");
          if (text[start] === "{") {
            if (stack.length === 0) break;
            if (stack.pop() !== "}") return null;
          }
        }

        // trim leading whitespace
        while (/[ \f\n\r\t\v]/.test(text[++start]));

        return { start, end, distance };
      }
    }
  }
}

function uniquifyNthType(n: number, type: string) {
  // NOTE: This pads the front of the string with n "zero-width joiner". We do
  // this because the highlighting for the current parameter in the signature
  // help feature is based on a string comparison with the parameter itself.
  // This causes a problem when there are multiple identical occurrences of the
  // same shape, e.g., `int => int => int` since the parameters are `["int",
  // "int"]`. This issue doesn't arise in languages like JavaScript or C#
  // because parameters always have a label with the type. So we work around the
  // issue by making the parameters by padding with the invisible space.
  // return `${"​".repeat(n)}${type}`;
  let buffer = "";
  for (let i = 0; i <= n; i++) buffer += "​";
  buffer += type;
  return buffer;
}

// sep::(formatter => unit => unit)? =>\n(formatter => 'a => unit) => formatter => list 'a => unit

export default function (session: Session): server.RequestHandler<server.TextDocumentPositionParams, types.SignatureHelp, void> {
  return async (event) => {
    const document = await command.getTextDocument(session, event.textDocument);
    const offTail = document.offsetAt(event.position);
    const offHead = Syntax.Application.Head.locate(session, document.getText(), offTail);
    let activeParameter: undefined | number = 0;
    const signatures: types.SignatureInformation[] = [];

    if (offHead == null) {
      // session.connection.sendNotification(remote.client.decorateApplicationHead, null);
    } else {
      const { distance, start, end } = offHead;
      if (0 < end) {
        const token = document.getText().substring(start, end);
        if (/^(?:[0-9]+(?:\.[0-9])*|[#\-@*/&%^+<=>|$][#\-:!?.@*/&%^+<=>|~$\\\\]*|[ \f\n\r\t\v_]|\blet\b|'\w+\b)$/.test(token)) {
          // session.connection.sendNotification(remote.client.decorateApplicationHead, null);
          return null;
        }

        // const range = types.Range.create(document.positionAt(start), document.positionAt(end));
        // const location = types.Location.create(event.textDocument.uri, range);

        const position = merlin.Position.fromCode(document.positionAt(start));
        const reqType = merlin.Query.type.expression(token).at(position);
        const rspType = await session.merlin.query(reqType, event.textDocument);
        if (rspType.class !== "return") {
          return null;
        }
        if (/^(?:[ \f\n\r\t\v_]|\btype\b.*)$/.test(rspType.value)) {
          return null;
        }

        let signature = parser.signature.domains(`${token}: ${rspType.value}`);
        signature = signature.map((t: string, n: number) => (n !== signature.length - 1) ? uniquifyNthType(n, t) : t);
        if (signature.length === distance) {
          return null;
        }

        const reqDocs = merlin.Query.document(token).at(position);
        const rspDocs = await session.merlin.query(reqDocs, event.textDocument);

        const parameters: types.ParameterInformation[] = signature.slice(0, signature.length - 1).map((label: string) => ({ label }));
        const label = `${token}: ${signature.join(" => ")}`;
        let documentation: undefined | string = undefined;
        if (rspDocs.class === "return") {
          if (!parser.ocamldoc.ignore.test(rspDocs.value)) {
            documentation = parser.ocamldoc.intoMarkdown(rspDocs.value);
          }
        }
        const info: types.SignatureInformation = types.SignatureInformation.create(
          label,
          documentation,
          ...parameters,
        );
        signatures.push(info);
        activeParameter = distance - 1;
      }
    }

    return {
      activeParameter,
      activeSignature: 0,
      signatures,
    };
  };
}

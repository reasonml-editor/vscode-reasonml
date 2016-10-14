const grammar = require("./grammar"); // tslint:disable-line
const nearley = require("nearley"); // tslint:disable-line

export const ignore = new RegExp([
  /^No documentation available/,
  /^Not a valid identifier/,
  /^Not in environment '.*'/,
].map((rx) => rx.source).join("|"));

export function intoMarkdown(ocamldoc: string): string {
  let result = ocamldoc;
  try {
    const parser = new nearley.Parser(grammar.ParserRules, grammar.ParserStart);
    const markedRes: null | string[] = parser.feed(ocamldoc).finish()[0];
    const markedDoc = markedRes && markedRes.length > 0 ? markedRes[0] : "";
    result = markedDoc;
  } catch (err) {
    // Debug.info(JSON.stringify(err));
  }
  return result;
}

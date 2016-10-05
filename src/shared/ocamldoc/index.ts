const compile = require("./compile/markdown"); // tslint:disable-line
const nearley = require("nearley"); // tslint:disable-line

export const ignore = new RegExp([
  /^No documentation available/,
  /^Not a valid identifier/,
  /^Not in environment '.*'/,
].map((rx) => rx.source).join("|"));

export function intoMarkdown(ocamldoc: string): string {
  let result = ocamldoc;
  try {
    const converter = new nearley.Parser(compile.ParserRules, compile.ParserStart);
    const markedRes: null | string[] = converter.feed(ocamldoc).finish()[0];
    const markedDoc = markedRes && markedRes.length > 0 ? markedRes[0] : "";
    result = markedDoc;
  } catch (err) {
    // Debug.info(JSON.stringify(err));
  }
  return result;
}

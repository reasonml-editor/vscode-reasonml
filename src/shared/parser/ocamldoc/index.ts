const parser = require("./grammar"); // tslint:disable-line

export const ignore = new RegExp([
  /^No documentation available/,
  /^Not a valid identifier/,
  /^Not in environment '.*'/,
].map((rx) => rx.source).join("|"));

export function intoMarkdown(ocamldoc: string): string {
  let result = ocamldoc;
  try {
    result = parser.parse(ocamldoc);
  } catch (err) {
    //
  }
  return result;
}

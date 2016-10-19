const parser = require("./grammar"); // tslint:disable-line

export function domains(signature: string): string[] {
  let result = [];
  try {
    result = parser.parse(signature);
  } catch (err) {
    //
  }
  return result;
}

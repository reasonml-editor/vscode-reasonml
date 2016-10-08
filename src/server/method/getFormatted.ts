import * as types from "../../shared/types";
import * as processes from "../processes";

export default async (idoc: types.TextDocument, range?: types.Range): Promise<string> => {
  const text = idoc.getText().substring(
    range ? idoc.offsetAt(range.start) : 0,
    range ? idoc.offsetAt(range.end) : undefined);
  const refmt = new processes.ReFMT(idoc.uri).child;
  refmt.stdin.write(text);
  refmt.stdin.end();
  const otxt = await new Promise<string>((resolve, reject) => {
    let buffer = "";
    refmt.stdout.on("error", (error: Error) => reject(error));
    refmt.stdout.on("data", (data: Buffer | string) => buffer += data.toString());
    refmt.stdout.on("end", () => resolve(buffer));
  });
  refmt.unref();
  return otxt.trim();
};

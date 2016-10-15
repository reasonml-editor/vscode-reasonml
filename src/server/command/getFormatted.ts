import { types } from "../../shared";
import * as processes from "../processes";
import * as session from "../session";

export default async (session: session.Session, idoc: types.TextDocument, range?: types.Range): Promise<null | string> => {
  const text = idoc.getText().substring(
    range ? idoc.offsetAt(range.start) : 0,
    range ? idoc.offsetAt(range.end) : undefined);
  if (/^\s*$/.test(text)) return text;
  const refmt = new processes.ReFMT(session, idoc.uri).child;
  refmt.stdin.write(text);
  refmt.stdin.end();
  const otxt = await new Promise<string>((resolve, reject) => {
    let buffer = "";
    refmt.stdout.on("error", (error: Error) => reject(error));
    refmt.stdout.on("data", (data: Buffer | string) => buffer += data.toString());
    refmt.stdout.on("end", () => resolve(buffer));
  });
  refmt.unref();
  return /^\s*$/.test(otxt) ? null : otxt.trim();
};

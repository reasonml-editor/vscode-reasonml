import { types } from "../../shared";
import * as processes from "../processes";
import Session from "../session";

export default async (session: Session, id: types.TextDocument, range?: types.Range): Promise<null | string> => {
  const text = id.getText().substring(
    range ? id.offsetAt(range.start) : 0,
    range ? id.offsetAt(range.end) : undefined);
  if (/^\s*$/.test(text)) return text;
  const refmt = new processes.ReFMT(session, id).child;
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

import { merlin } from "../../shared";
import { Session } from "../session";
import { Glob } from "glob";
import * as server from "vscode-languageserver";

export default async function (session: Session, event: server.TextDocumentIdentifier): Promise<server.TextDocumentIdentifier[]> {
  const request = merlin.Query.path.list.source();
  const response = await session.merlin.query(request, event.uri);
  if (response.class !== "return") return [];
  const projectDirs: Set<string> = new Set();
  const projectMods: server.TextDocumentIdentifier[] = [];
  for (const cwd of response.value) {
    if (cwd && !(/\.opam\b/.test(cwd) || projectDirs.has(cwd))) {
      projectDirs.add(cwd);
      const mods = new Glob("*.re?(i)", { cwd, realpath: true, sync: true }).found;
      for (const mod of mods) {
        const uri = `file://${mod}`;
        projectMods.push({ uri });
      }
    }
  }
  return projectMods;
}

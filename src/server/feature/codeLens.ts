import { merlin, types } from "../../shared";
import * as command from "../command";
import Session from "../session";
import * as server from "vscode-languageserver";

const annotateKinds = new Set([
  types.SymbolKind.Variable,
]);

export default function(session: Session): server.RequestHandler<server.CodeLensParams, types.CodeLens[], void> {
  return async ({ textDocument }, token) => {
    const languages: Set<string> = new Set(session.settings.reason.server.languages);
    if (languages.size < 1) return [];

    const allowedFileKinds: string[] = [];
    if (languages.has("ocaml")) allowedFileKinds.push("ml");
    if (languages.has("reason")) allowedFileKinds.push("re");

    const fileKindMatch = textDocument.uri.match(new RegExp(`\.(${allowedFileKinds.join("|")})$`));
    if (fileKindMatch == null) return [];
    const fileKind = fileKindMatch[1];
    const isOCaml  = fileKind === "ml";
    const isReason = fileKind === "re";

    const request = merlin.Query.outline();
    const response = await session.merlin.query(request, textDocument, 1);
    if (token.isCancellationRequested) return [];

    if (response.class !== "return") return []; // new rpc.ResponseError(-1, "onCodeLens: failed", undefined);
    const textDoc = await command.getTextDocument(session, textDocument);
    if (token.isCancellationRequested) return [];

    const symbols = merlin.Outline.intoCode(response.value, textDocument);
    const codeLenses: types.CodeLens[] = [];
    let matches: null | RegExpMatchArray = null;
    let textLine: null | string = null;
    for (const { containerName, kind, location, name } of symbols) {
      if (annotateKinds.has(kind)) {
        const { range } = location;
        const { start } = range;
        const end = types.Position.create(start.line + 1, 0);
        const { character, line } = start;
        const position = types.Position.create(line, character);
        const event = { position, textDocument };
        // reason requires computing some offsets first
        if (isReason
        && (null != (textLine = textDoc.getText().substring(textDoc.offsetAt(start), textDoc.offsetAt(end)))) // tslint:disable-line no-conditional-assignment
        && (null != (matches = textLine.match(/^\s*\b(and|let)\b(\s*)(\brec\b)?(\s*)(?:(?:\(?(?:[^\)]*)\)?(?:\s*::\s*(?:(?:\b\w+\b)|\((?:\b\w+\b):.*?\)=(?:\b\w+\b)))?|\((?:\b\w+\b)(?::.*?)?\))\s*)(?:(?:(?:(?:\b\w+\b)(?:\s*::\s*(?:(?:\b\w+\b)|\((?:\b\w+\b):.*?\)=(?:\b\w+\b)))?|\((?:\b\w+\b)(?::.*?)?\))\s*)|(?::(?=[^:])(?:.*?=>)*)?(?:.*?=)\s*[^\s=;]+?\s*.*?;?$)/m)))) { // tslint:disable-line no-conditional-assignment
          event.position.character +=              matches[1].length;
          event.position.character +=              matches[2].length;
          event.position.character += matches[3] ? matches[3].length : 0;
          event.position.character +=              matches[4].length;
        }
        if (isOCaml || (null != (matches))) codeLenses.push({ data: { containerName, event, fileKind, kind, location, name }, range });
      }
    }
    return codeLenses;
  };
}

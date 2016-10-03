import * as merlin from "./process/merlin";
import * as server from "vscode-languageserver";
import * as types from "vscode-languageserver-types";

const ocamldoc = require("../client/render/ocamldoc"); // tslint:disable-line
const nearley = require("nearley"); // tslint:disable-line

namespace OcamlDoc {
  export const ignore = new RegExp([
    /^No documentation available/,
    /^Not a valid identifier/,
    /^Not in environment '.*'/,
  ].map((rx) => rx.source).join("|"));

  export function intoMarkdown(ocamlDoc: string): string {
    let result = ocamlDoc;
    try {
      const parser = new nearley.Parser(ocamldoc.ParserRules, ocamldoc.ParserStart);
      const markedRes: string[] | undefined = parser.feed(ocamlDoc).finish()[0];
      const markedDoc = markedRes && markedRes.length > 0 ? markedRes[0] : "";
      result = markedDoc;
    } catch (err) {
      // Debug.info(JSON.stringify(err));
    }
    return result;
  }
}

class Session {
  public readonly connection: server.IConnection = server.createConnection(
    new server.IPCMessageReader(process),
    new server.IPCMessageWriter(process),
  );
  public readonly docManager = new server.TextDocuments();
  public readonly merlin = new merlin.Session();
  private readonly config: {
    diagnostics: {
      delay: number;
    };
  } = {
    diagnostics: {
      delay: 250,
    },
  };
  private readonly symbol: {
    timeout: {
      diagnostics: symbol;
    };
  } = {
    timeout: {
      diagnostics: Symbol(),
    },
  };
  public async diagnosticsClear(event: types.TextDocumentChangeEvent): Promise<void> {
    session.connection.sendDiagnostics({
      diagnostics: [],
      uri: event.document.uri,
    });
  }
  public async diagnosticsRefresh(event: types.TextDocumentChangeEvent): Promise<void> {
    this.diagnosticsClear(event);
    const handle = this.symbol.timeout.diagnostics;
    const object: { [key: string]: number } = event.document as any;
    clearTimeout(object[handle]);
    object[handle] = setTimeout(async () => {
      const errorResponse = await session.merlin.query(merlin.command.Query.errors(), event.document.uri);
      if (errorResponse.class === "return") {
        const diagnostics = errorResponse.value.map(merlin.data.ErrorReport.intoCode);
        session.connection.sendDiagnostics({ uri: event.document.uri, diagnostics });
      }
    }, this.config.diagnostics.delay);
  }
  public listen() {
    this.docManager.listen(this.connection);
    this.connection.listen();
  }
}
const session = new Session();

// namespace Debug {
//   export function info(message: string): void {
//     session.connection.console.log(message);
//   }
// }

session.connection.onCompletion(async (event) => {
  let error = undefined;
  let prefix: string | undefined = undefined;
  try {
    const method = "getText";
    prefix = await session.connection.sendRequest<
      server.TextDocumentPositionParams,
      string | undefined,
      void
    >({ method }, event);
  } catch (err) {
    // ignore errors from completing ' .'
    error = err;
  }
  if (error != null || prefix == null) {
    return [];
  }
  const position = merlin.ordinal.Position.fromCode(event.position);
  const request = merlin.command.Query.complete.prefix(prefix).at(position).with.doc();
  const response = await session.merlin.query(request, event.textDocument.uri);
  if (response.class !== "return") {
    return new server.ResponseError(-1, "onCompletion: failed", undefined);
  }
  const value = response.value;
  const entries = value.entries ? value.entries : [];
  return entries.map(merlin.data.Completion.intoCode);
});

session.connection.onCompletionResolve(async (event) => {
  // FIXME: might want to make a separate parser to just strip ocamldoc
  const documentation: string = event.data.documentation
    .replace(/\{\{:.*?\}(.*?)\}/g, "$1")
    .replace(/\{!(.*?)\}/g, "$1");
  const markedDoc = OcamlDoc.intoMarkdown(documentation)
    .replace(/`(.*?)`/g, "$1")
    .replace(/\s+/g, " ")
    .replace(/\n/g, "");
  event.documentation = markedDoc;
  return event;
});

session.connection.onDefinition(async (event) => {
  const find = async (kind: "ml" | "mli"): Promise<types.Location | undefined> => {
    const request = merlin.command.Query.locate(null, kind).at(merlin.ordinal.Position.fromCode(event.position));
    const response = await session.merlin.query(request, event.textDocument.uri);
    if (response.class !== "return" || response.value.pos == null) {
      return undefined;
    }
    const value = response.value;
    const uri = value.file ? `file://${value.file}` : event.textDocument.uri;
    const position = merlin.ordinal.Position.intoCode(value.pos);
    const range = types.Range.create(position, position);
    const location = types.Location.create(uri, range);
    return location;
  };
  const locML  = await find("ml");
  // const locMLI = await find("mli"");
  const locations: types.Location[] = [];
  if (locML  != null) {
    locations.push(locML);
  }
  // if (locMLI != null) locations.push(locMLI);
  return locations;
});

session.connection.onDocumentSymbol(async (event) => {
  const request = merlin.command.Query.outline();
  const response = await session.merlin.query(request, event.textDocument.uri);
  if (response.class !== "return") {
    return new server.ResponseError(-1, "onDocumentSymbol: failed", undefined);
  }
  const symbols = merlin.data.Outline.intoCode(response.value, event.textDocument.uri);
  return symbols;
});

session.connection.onHover(async (event) => {
  const getType = async (): Promise<undefined | {
    end: merlin.ordinal.Position;
    start: merlin.ordinal.Position;
    tail: merlin.data.TailPosition;
    type: string;
  }> => {
    const position = merlin.ordinal.Position.fromCode(event.position);
    const request = merlin.command.Query.type.enclosing.at(position);
    const response = await session.merlin.query(request, event.textDocument.uri);
    if (response.class !== "return") {
      return undefined;
    }
    return (response.value.length > 0) ? response.value[0] : undefined;
  };
  const getDoc = async (): Promise<string | undefined> => {
    const position = merlin.ordinal.Position.fromCode(event.position);
    const request = merlin.command.Query.document(null).at(position);
    const response = await session.merlin.query(request, event.textDocument.uri);
    if (response.class !== "return") {
      return undefined;
    }
    return response.value;
  };
  const markedStrings: server.MarkedString[] = [];
  const itemType = await getType();
  const ocamlDoc = await getDoc();
  if (itemType != null) {
    markedStrings.push({ language: "reason.hover.type", value: itemType.type });
    markedStrings.push(merlin.data.TailPosition.intoCode(itemType.tail)); // FIXME: make configurable
    if (ocamlDoc != null && !OcamlDoc.ignore.test(ocamlDoc)) {
      markedStrings.push(OcamlDoc.intoMarkdown(ocamlDoc));
    }
  }
  return { contents: markedStrings };
});

session.connection.onInitialize(async (): Promise<server.InitializeResult> => {
  const request = merlin.command.Sync.protocol.version.set(3);
  const response = await session.merlin.sync(request);
  if (response.class !== "return" || response.value.selected !== 3) {
    session.connection.dispose();
    throw new Error("onInitialize: failed to establish protocol v3");
  }
  return {
    capabilities: {
      completionProvider: {
        resolveProvider: true,
        triggerCharacters: [ ".", "#" ],
      },
      definitionProvider: true,
      documentFormattingProvider: true,
      documentSymbolProvider: true,
      hoverProvider: true,
      textDocumentSync: session.docManager.syncKind,
    },
  };
});

session.connection.onRequest<
  { range: types.Range, textDocument: { uri: string }},
  Promise<merlin.data.Case.Destruct>,
  void
>({ method: "caseAnalysis"}, async (event) => {
  const start = merlin.ordinal.Position.fromCode(event.range.start);
  const end = merlin.ordinal.Position.fromCode(event.range.end);
  const request = merlin.command.Query.kase.analysis.from(start).to(end);
  const response = await session.merlin.query(request, event.textDocument.uri);
  if (response.class !== "return") {
    throw response.value;
  }
  return response.value;
});

session.docManager.onDidChangeContent(async (event) => {
  const request = merlin.command.Sync.tell("start", "end", event.document.getText());
  await session.merlin.sync(request, event.document.uri);
  session.diagnosticsRefresh(event);
});

session.docManager.onDidClose(async (event) => {
  session.diagnosticsClear(event);
});

session.docManager.onDidOpen(async (event) => {
  const request = merlin.command.Sync.tell("start", "end", event.document.getText());
  await session.merlin.sync(request, event.document.uri);
  session.diagnosticsRefresh(event);
});

session.docManager.onDidSave(async (event) => {
  session.diagnosticsRefresh(event);
});

session.listen();

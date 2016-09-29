import * as server from 'vscode-languageserver';
import * as types from 'vscode-languageserver-types';
import * as merlin from './merlin';

class Session {
  private config: {
    diagnostics: {
      delay: number;
    };
  } = {
    diagnostics: {
      delay: 250,
    },
  };
  static symbol: {
    timeout: {
      diagnostics: symbol;
    };
  } = {
    timeout: {
      diagnostics: Symbol(),
    },
  };
  readonly connection: server.IConnection = server.createConnection(
    new server.IPCMessageReader(process),
    new server.IPCMessageWriter(process),
  );
  readonly docManager = new server.TextDocuments();
  readonly merlin = new merlin.Session();
  async diagnosticsClear(event: types.TextDocumentChangeEvent): Promise<void> {
    session.connection.sendDiagnostics({ uri: event.document.uri, diagnostics: [] });
  }
  async diagnosticsRefresh(event: types.TextDocumentChangeEvent): Promise<void> {
    this.diagnosticsClear(event);
    const handle = Session.symbol.timeout.diagnostics;
    const object: { [key: string]: number } = event.document as any;
    clearTimeout(object[handle]);
    object[handle] = setTimeout(async () => {
      const errorResponse = await session.merlin.query(merlin.Command.Query.errors(), event.document.uri);
      if (errorResponse.class === 'return') {
        const diagnostics = errorResponse.value.map(merlin.ErrorReport.intoCode);
        session.connection.sendDiagnostics({ uri: event.document.uri, diagnostics });
      }
    }, this.config.diagnostics.delay);
  }
  listen() {
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
    const method = 'getText';
    prefix = await session.connection.sendRequest<server.TextDocumentPositionParams, string | undefined, void>({ method }, event);
  } catch (err) {
    // ignore errors from completing ' .'
    error = err;
  }
  if (error != null || prefix == null) return [];
  const position = merlin.Position.fromCode(event.position);
  const request = merlin.Command.Query.complete.prefix(prefix).at(position).with.doc();
  const response = await session.merlin.query(request, event.textDocument.uri);
  if (response.class !== 'return') {
    return new server.ResponseError(-1, 'onCompletion: failed', undefined);
  }
  const value = response.value;
  const entries = value.entries ? value.entries : [];
  return entries.map(merlin.Completion.intoCode);
});

session.connection.onDefinition(async (event) => {
  const find = async (kind: 'ml' | 'mli'): Promise<types.Location | undefined> => {
    const request = merlin.Command.Query.locate(null, kind).at(merlin.Position.fromCode(event.position));
    const response = await session.merlin.query(request, event.textDocument.uri);
    if (response.class !== 'return' || response.value.pos == null) return undefined;
    const value = response.value;
    const uri = value.file ? `file://${value.file}` : event.textDocument.uri;
    const position = merlin.Position.intoCode(value.pos);
    const range = types.Range.create(position, position);
    const location = types.Location.create(uri, range);
    return location;
  };
  const locML  = await find('ml');
  // const locMLI = await find('mli');
  const locations: types.Location[] = [];
  if (locML  != null) locations.push(locML);
  // if (locMLI != null) locations.push(locMLI);
  return locations;
});

session.connection.onDocumentSymbol(async (event) => {
  const request = merlin.Command.Query.outline();
  const response = await session.merlin.query(request, event.textDocument.uri);
  if (response.class !== 'return') {
    return new server.ResponseError(-1, 'onDocumentSymbol: failed', undefined);
  }
  const symbols = merlin.Outline.intoCode(response.value, event.textDocument.uri);
  return symbols;
});

session.connection.onHover(async (event) => {
  const position = merlin.Position.fromCode(event.position);
  const request = merlin.Command.Query.type.enclosing.at(position);
  const response = await session.merlin.query(request, event.textDocument.uri);
  if (response.class !== 'return') {
    return new server.ResponseError(-1, 'onHover: failed', undefined);
  }
  const value = response.value;
  const markedStrings: server.MarkedString[] = [];
  if (value.length > 0) {
    const item = value[0];
    markedStrings.push(merlin.TailPosition.intoCode(item.tail)); // FIXME: make configurable
    markedStrings.push({ language: 'reason.hover.type', value: item.type });
  }
  return { contents: markedStrings };
});

session.connection.onInitialize(async (): Promise<server.InitializeResult> => {
  const request = merlin.Command.Sync.protocol.version.set(3);
  const response = await session.merlin.sync(request);
  if (response.class !== 'return' || response.value.selected !== 3) {
    session.connection.dispose();
    throw new Error('onInitialize: failed to establish protocol v3');
  }
  return {
    capabilities: {
      completionProvider: { triggerCharacters: [ '.', '#' ] },
      definitionProvider: true,
      documentSymbolProvider: true,
      hoverProvider: true,
      textDocumentSync: session.docManager.syncKind,
    },
  }
});

session.docManager.onDidChangeContent(async (event) => {
  const request = merlin.Command.Sync.tell('start', 'end', event.document.getText());
  await session.merlin.sync(request, event.document.uri);
  session.diagnosticsRefresh(event);
});

session.docManager.onDidClose(async (event) => {
  session.diagnosticsClear(event);
});

session.docManager.onDidOpen(async (event) => {
  const request = merlin.Command.Sync.tell('start', 'end', event.document.getText());
  await session.merlin.sync(request, event.document.uri);
  session.diagnosticsRefresh(event);
});

session.docManager.onDidSave(async (event) => {
  session.diagnosticsRefresh(event);
});

session.listen();

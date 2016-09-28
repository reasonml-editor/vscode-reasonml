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

session.connection.onCompletion(async (data) => {
  let error = undefined;
  let prefix: string | undefined = undefined;

  try {
    const method = 'getText';
    prefix = await session.connection.sendRequest<server.TextDocumentPositionParams, string | undefined, void>({ method }, data);
  } catch (err) {
    // ignore errors from completing ' .'
    error = err;
  }
  if (error != null || prefix == null) return [];

  const pos = merlin.Position.fromCode(data.position);
  const command = merlin.Command.Query.complete.prefix(prefix).at(pos).with.doc();
  const response = await session.merlin.query(command, data.textDocument.uri);
  if (response.class !== 'return') {
    return new server.ResponseError(-1, 'onCompletion: failed', undefined);
  }

  const entries = response.value.entries ? response.value.entries : [];
  return entries.map(merlin.Completion.intoCode);
});

session.connection.onHover(async (data) => {
  const position = merlin.Position.fromCode(data.position);
  const response = await session.merlin.query(
    merlin.Command.Query.type.enclosing.at(position),
    data.textDocument.uri,
  );
  if (response.class !== 'return') {
    return new server.ResponseError(-1, 'session.connection::onHover failed', undefined);
  }
  const markedStrings: server.MarkedString[] = [];
  if (response.value.length > 0) {
    markedStrings.push({ language: 'reason.hover', value: response.value[0].type });
  }
  return { contents: markedStrings };
});

session.connection.onInitialize(async (): Promise<server.InitializeResult> => {
  const response = await session.merlin.sync(merlin.Command.Sync.protocol.version.set(3));
  if (response.class !== 'return' || response.value.selected !== 3) {
    session.connection.dispose();
    throw new Error('session.connection::onInitialize: failed to establish protocol v3');
  }
  return {
    capabilities: {
      completionProvider: { triggerCharacters: [ '.', '#' ] },
      hoverProvider: true,
      textDocumentSync: session.docManager.syncKind,
    },
  }
});

session.connection.onReferences((_data) => {
  return new server.ResponseError(-1, 'onReferences not implemented', undefined);
});

session.connection.onRenameRequest((_data) => {
  return new server.ResponseError(-1, 'onRenameRequest not implemented', undefined);
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
  await session.merlin.sync(
    merlin.Command.Sync.tell('start', 'end', event.document.getText()),
    event.document.uri,
  );
  session.diagnosticsRefresh(event);
});

session.docManager.onDidSave(async (event) => {
  session.diagnosticsRefresh(event);
});

session.listen();

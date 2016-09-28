import * as server from 'vscode-languageserver';
import * as merlin from './merlin';

class Session {
  readonly connection: server.IConnection = server.createConnection(
    new server.IPCMessageReader(process),
    new server.IPCMessageWriter(process),
  );
  readonly merlin = new merlin.Session();
}
const session = new Session();

// namespace Debug {
//   export function info(message: string): void {
//     session.connection.console.log(message);
//   }
// }

session.connection.onCodeAction((_data) => {
  return new server.ResponseError(-1, 'onCodeAction not implemented', undefined);
});

session.connection.onCodeLens((_data) => {
  return new server.ResponseError(-1, 'onCodeLens not implemented', undefined);
});

session.connection.onCodeLensResolve((_data) => {
  return new server.ResponseError(-1, 'onCodeLensResolve not implemented', undefined);
});

session.connection.onCompletion(async (data) => {
  const method = 'getText';
  const prefix = await session.connection.sendRequest<server.TextDocumentPositionParams, string | undefined, void>({ method }, data);
  if (prefix == null) {
    return [];
  }
  const pos = merlin.Position.fromCode(data.position);
  const command = merlin.Command.Query.complete.prefix(prefix).at(pos).with.doc();
  const response = await session.merlin.query(command, data.textDocument.uri);
  if (response.class !== 'return') {
    return new server.ResponseError(-1, 'onCompletion: failed', undefined);
  }
  return response.value.entries.map(merlin.Completion.intoCode);
});

session.connection.onCompletionResolve((_data) => {
  return new server.ResponseError(-1, 'onCompletionResolve not implemented', undefined);
});

session.connection.onDefinition((_data) => {
  return new server.ResponseError(-1, 'onDefinition not implemented', undefined);
});

session.connection.onDidChangeConfiguration((_data) => {
});

session.connection.onDidChangeTextDocument(async (data) => {
  const requests: merlin.Command.Sync<['tell', merlin.Position, merlin.Position, string] , undefined>[] = [];
  for (const change of data.contentChanges) {
    if (change && change.range) {
      const startPos = merlin.Position.fromCode(change.range.start);
      const endPos = merlin.Position.fromCode(change.range.end);
      const request = merlin.Command.Sync.tell(startPos, endPos, change.text);
      requests.push(request);
    }
  }
  for (const request of requests) {
    if (request) {
      await session.merlin.sync(request, data.textDocument.uri);
    }
  }
  // if (data.contentChanges.length > 1 || (data.contentChanges[0] && (data.contentChanges[0].text === '' || /[^A-Za-z0-9'_#\.]/.exec(data.contentChanges[0].text)))) {
  //   const errorResponse = await session.merlin.query(merlin.Command.Query.errors(), data.textDocument.uri);
  //   if (errorResponse.class === 'return') {
  //     const diagnostics = errorResponse.value.map(merlin.ErrorReport.intoCode);
  //     session.connection.sendDiagnostics({ uri: data.textDocument.uri, diagnostics });
  //   }
  // }
});

session.connection.onDidChangeWatchedFiles((_data) => {
});

session.connection.onDidCloseTextDocument(async (data) => {
  await session.merlin.sync(
    merlin.Command.Sync.tell('start', 'end', ''),
    data.textDocument.uri,
  );
  session.connection.sendDiagnostics({ uri: data.textDocument.uri, diagnostics: [] });
});

session.connection.onDidOpenTextDocument(async (data) => {
  await session.merlin.sync(
    merlin.Command.Sync.tell('start', 'end', data.textDocument.text),
    data.textDocument.uri,
  );
  const errorResponse = await session.merlin.query(merlin.Command.Query.errors(), data.textDocument.uri);
  if (errorResponse.class === 'return') {
    const diagnostics = errorResponse.value.map(merlin.ErrorReport.intoCode);
    session.connection.sendDiagnostics({ uri: data.textDocument.uri, diagnostics });
  }
});

session.connection.onDidSaveTextDocument(async (data) => {
  const errorResponse = await session.merlin.query(merlin.Command.Query.errors(), data.textDocument.uri);
  if (errorResponse.class === 'return') {
    const diagnostics = errorResponse.value.map(merlin.ErrorReport.intoCode);
    session.connection.sendDiagnostics({ uri: data.textDocument.uri, diagnostics });
  }
});

session.connection.onDocumentFormatting((_data) => {
  return new server.ResponseError(-1, 'onDocumentFormatting not implemented', undefined);
});

session.connection.onDocumentHighlight((_data) => {
  return new server.ResponseError(-1, 'onDocumentHighlight not implemented', undefined);
});

session.connection.onDocumentOnTypeFormatting((_data) => {
  return new server.ResponseError(-1, 'onDocumentTypeFormatting not implemented', undefined);
});

session.connection.onDocumentRangeFormatting((_data) => {
  return new server.ResponseError(-1, 'onDocumentRangeFormatting not implemented', undefined);
});

session.connection.onDocumentSymbol((_data) => {
  return new server.ResponseError(-1, 'onDocumentSymbols not implemented', undefined);
});

session.connection.onExit((_data) => {
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
      textDocumentSync: server.TextDocumentSyncKind.Incremental,
    },
  }
});

session.connection.onReferences((_data) => {
  return new server.ResponseError(-1, 'onReferences not implemented', undefined);
});

session.connection.onRenameRequest((_data) => {
  return new server.ResponseError(-1, 'onRenameRequest not implemented', undefined);
});

session.connection.listen();

import * as server from 'vscode-languageserver';
import * as merlin from './merlin';

const connection: server.IConnection = server.createConnection(
  new server.IPCMessageReader(process),
  new server.IPCMessageWriter(process),
);

const merlinManager = new merlin.Session();

// namespace Debug {
//   const mode: 'enabled' | 'disabled' = 'disabled';
//   export function info(message: string): void {
//     if (mode === 'enabled') {
//       connection.console.log(message);
//     }
//   }
// }

connection.onCodeAction((_data) => {
  return new server.ResponseError(-1, "onCodeAction not implemented", undefined);
});

connection.onCodeLens((_data) => {
  return new server.ResponseError(-1, "onCodeLens not implemented", undefined);
});

connection.onCodeLensResolve((_data) => {
  return new server.ResponseError(-1, "onCodeLensResolve not implemented", undefined);
});

connection.onCompletion((_data) => {
  return [];
});

connection.onCompletionResolve((_data) => {
  return (null as any);
});

connection.onDefinition((_data) => {
  return new server.ResponseError(-1, "onDefinition not implemented", undefined);
});

connection.onDidChangeConfiguration((_data) => {
});

connection.onDidChangeTextDocument(async (data) => {
  const path = data.textDocument.uri;
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
      await merlinManager.sync(request, path);
    }
  }
});

connection.onDidChangeWatchedFiles((_data) => {
});

connection.onDidCloseTextDocument(async (data) => {
  await merlinManager.sync(
    merlin.Command.Sync.tell('start', 'end', ''),
    data.textDocument.uri,
  );
});

connection.onDidOpenTextDocument(async (data) => {
  await merlinManager.sync(
    merlin.Command.Sync.tell('start', 'end', data.textDocument.text),
    data.textDocument.uri,
  );
});

connection.onDidSaveTextDocument((_data) => {
});

connection.onDocumentFormatting((_data) => {
  return new server.ResponseError(-1, "onDocumentFormatting not implemented", undefined);
});

connection.onDocumentHighlight((_data) => {
  return new server.ResponseError(-1, "onDocumentHighlight not implemented", undefined);
});

connection.onDocumentOnTypeFormatting((_data) => {
  return new server.ResponseError(-1, "onDocumentTypeFormatting not implemented", undefined);
});

connection.onDocumentRangeFormatting((_data) => {
  return new server.ResponseError(-1, "onDocumentRangeFormatting not implemented", undefined);
});

connection.onDocumentSymbol((_data) => {
  return new server.ResponseError(-1, "onDocumentSymbols not implemented", undefined);
});

connection.onExit((_data) => {
});

connection.onHover(async (data) => {
  const position = merlin.Position.fromCode(data.position);
  const response = await session.merlin.query(
    merlin.Command.Query.type.enclosing.at(position),
    data.textDocument.uri,
  );
  if (!(response.class === 'return')) {
    return new server.ResponseError(-1, 'connection::onHover failed0', undefined);
  }
  const markedStrings: server.MarkedString[] = [];
  if (response.value.length > 0) {
    markedStrings.push(response.value[0].type);
  }
  return { contents: markedStrings };
});

connection.onInitialize(async (): Promise<server.InitializeResult> => {
  const response = await merlinManager.sync(merlin.Command.Sync.protocol.version.set(3));
  if (!(response.class === "return" && response.value.selected === 3)) {
    connection.dispose();
    throw new Error('connection::onInitialize: failed to establish protocol v3');
  }
  return {
    capabilities: {
      hoverProvider: true,
      textDocumentSync: server.TextDocumentSyncKind.Incremental,
    },
  }
});

connection.onReferences((_data) => {
  return new server.ResponseError(-1, 'onReferences not implemented', undefined);
});

connection.onRenameRequest((_data) => {
  return new server.ResponseError(-1, 'onRenameRequest not implemented', undefined);
});

connection.listen();

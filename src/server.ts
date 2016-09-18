import * as server from 'vscode-languageserver';
import * as merlin from './merlin';

const connection: server.IConnection = server.createConnection(
  new server.IPCMessageReader(process),
  new server.IPCMessageWriter(process),
);

const reasonManager = new server.TextDocuments();
const merlinManager = new merlin.Session();

namespace Debug {
  const mode: 'enabled' | 'disabled' = 'disabled';
  export function info(message: string): void {
    if (mode === 'enabled') {
      connection.console.log(message);
    }
  }
}

connection.onCodeAction((_data) => {
  Debug.info('connection::onCodeAction');
  return new server.ResponseError(-1, "onCodeAction not implemented", undefined);
});

connection.onCodeLens((_data) => {
  Debug.info('connection::onCodeLens');
  return new server.ResponseError(-1, "onCodeLens not implemented", undefined);
});

connection.onCodeLensResolve((_data) => {
  Debug.info('connection::onCodeLensResolve');
  return new server.ResponseError(-1, "onCodeLensResolve not implemented", undefined);
});

connection.onCompletion((_textDocumentPosition: server.TextDocumentPositionParams): server.CompletionItem[] => {
  Debug.info('connection::onCompletion');
  return [];
});

connection.onCompletionResolve((_item: server.CompletionItem): server.CompletionItem => {
  Debug.info('connection::onCompletionResolve');
  return (null as any);
});

connection.onDefinition((_data) => {
  Debug.info('connection::onDefinition');
  return new server.ResponseError(-1, "onDefinition not implemented", undefined);
});

connection.onDidChangeConfiguration((_data) => {
  Debug.info('connection::onDidChangeConfiguration');
});

connection.onDidChangeTextDocument((_data) => {
  Debug.info('connection::onDidChangeTextDocument');
});

connection.onDidChangeWatchedFiles((_data) => {
  Debug.info('connection::onDidChangeWatchedFiles');
});

connection.onDidCloseTextDocument((_data) => {
  Debug.info('connection::onDidCloseTextDocument');
});

connection.onDidOpenTextDocument((_data) => {
  Debug.info('connection::onDidOpenTextDocument');
});

connection.onDidSaveTextDocument((_data) => {
  Debug.info('connection::onDidSaveTextDocument');
  return new server.ResponseError(-1, "onDidSaveTextDocument not implemented", undefined);
});

connection.onDocumentFormatting((_data) => {
  Debug.info('connection::onDocumentFormatting');
  return new server.ResponseError(-1, "onDocumentFormatting not implemented", undefined);
});

connection.onDocumentHighlight((_data) => {
  Debug.info('connection::onDocumentHighlight');
  return new server.ResponseError(-1, "onDocumentHighlight not implemented", undefined);
});

connection.onDocumentOnTypeFormatting((_data) => {
  Debug.info('connection::onDocumentOnTypeFormatting');
  return new server.ResponseError(-1, "onDocumentTypeFormatting not implemented", undefined);
});

connection.onDocumentRangeFormatting((_data) => {
  Debug.info('connection::onDocumentRangeFormatting');
  return new server.ResponseError(-1, "onDocumentRangeFormatting not implemented", undefined);
});

connection.onDocumentSymbol((_data) => {
  Debug.info('connection::onDocumentSymbol');
  return new server.ResponseError(-1, "onDocumentSymbols not implemented", undefined);
});

connection.onExit((_data) => {
  Debug.info('connection::onExit');
});

connection.onHover(async (data) => {
  const pos: merlin.Position = {
    col: data.position.character,
    line: data.position.line + 1,
  };
  const response = await merlinManager.sync(
    merlin.Command.Sync.type.enclosing.at(pos),
    data.textDocument.uri,
  );
  if (!(response.class === 'return')) {
    return new server.ResponseError(-1, "onHover is not implemented", undefined);
  }
  const contents = response.value[0].type;
  return { contents };
});

connection.onInitialize(async (): Promise<server.InitializeResult> => {
  Debug.info('connection::onInitialize');
  const response = await merlinManager.sync(merlin.Command.Sync.protocol.version.set(3));
  if (!(response.class === "return" && response.value.selected === 3)) {
    connection.dispose();
    throw new Error(`connection::onInitialize: failed to establish protocol v3`);
  }
  Debug.info('connection::onInitialize: established merlin protocol v3');
  return {
    capabilities: {
      hoverProvider: true,
      textDocumentSync: reasonManager.syncKind,
    },
  }
});

connection.onReferences((_data) => {
  Debug.info('connection::onReference');
  return new server.ResponseError(-1, "onReferences not implemented", undefined);
});

connection.onRenameRequest((_data) => {
  Debug.info('connection::onRenameRequest');
  return new server.ResponseError(-1, "onRenameRequest not implemented", undefined);
});

reasonManager.onDidChangeContent(async (data) => {
  let source = data.document.getText();
  Debug.info(`reasonManager::onDidChangeContent: ${'\n'}${source}`);
  let response = await merlinManager.sync(
    merlin.Command.Sync.tell('start', 'end', source),
    data.document.uri,
  );
  Debug.info(JSON.stringify(response));
});

reasonManager.onDidClose((_data) => {
  Debug.info(`reasonManager::onDidClose`);
});

reasonManager.onDidOpen((_data) => {
  Debug.info(`reasonManager::onDidOpen`);
});

reasonManager.onDidSave((_data) => {
  Debug.info(`reasonManager::onDidSave`);
});

reasonManager.listen(connection);
connection.listen();

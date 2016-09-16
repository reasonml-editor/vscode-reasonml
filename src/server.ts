import * as server from 'vscode-languageserver';

let connection: server.IConnection = server.createConnection(
  new server.IPCMessageReader(process),
  new server.IPCMessageWriter(process),
);
let docManager = new server.TextDocuments();

namespace Debug {
  const mode: 'enabled' | 'disabled' = 'disabled';
  export function info(message: string): void {
    if (mode === 'enabled') {
      connection.window.showInformationMessage(message);
    }
  }
}

connection.onCodeAction((_args) => {
  Debug.info('server::onCodeAction');
  return new server.ResponseError(-1, "onCodeAction not implemented", undefined);
});

connection.onCodeLens((_args) => {
  Debug.info('server::onCodeLens');
  return new server.ResponseError(-1, "onCodeLens not implemented", undefined);
});

connection.onCodeLensResolve((_args) => {
  Debug.info('server::onCodeLensResolve');
  return new server.ResponseError(-1, "onCodeLensResolve not implemented", undefined);
});

connection.onCompletion((_textDocumentPosition: server.TextDocumentPositionParams): server.CompletionItem[] => {
  Debug.info('server::onCompletion');
  return [];
});

connection.onCompletionResolve((_item: server.CompletionItem): server.CompletionItem => {
  Debug.info('server::onCompletionResolve');
  return (null as any);
});

connection.onDefinition((_args) => {
  Debug.info('server::onDefinition');
  return new server.ResponseError(-1, "onDefinition not implemented", undefined);
});

connection.onDidChangeConfiguration((_args) => {
  Debug.info('server::onDidChangeConfiguration');
});

connection.onDidChangeTextDocument((_args) => {
  Debug.info('server::onDidChangeTextDocument');
});

connection.onDidChangeWatchedFiles((_args) => {
  Debug.info('server::onDidChangeWatchedFiles');
});

connection.onDidCloseTextDocument((_args) => {
  Debug.info('server::onDidCloseTextDocument');
});

connection.onDidOpenTextDocument((_args) => {
  Debug.info('server::onDidOpenTextDocument');
});

connection.onDidSaveTextDocument((_args) => {
  Debug.info('server::onDidSaveTextDocument');
  return new server.ResponseError(-1, "onDidSaveTextDocument not implemented", undefined);
});

connection.onDocumentFormatting((_args) => {
  Debug.info('server::onDocumentFormatting');
  return new server.ResponseError(-1, "onDocumentFormatting not implemented", undefined);
});

connection.onDocumentHighlight((_args) => {
  Debug.info('server::onDocumentHighlight');
  return new server.ResponseError(-1, "onDocumentHighlight not implemented", undefined);
});

connection.onDocumentOnTypeFormatting((_args) => {
  Debug.info('server::onDocumentOnTypeFormatting');
  return new server.ResponseError(-1, "onDocumentTypeFormatting not implemented", undefined);
});

connection.onDocumentRangeFormatting((_args) => {
  Debug.info('server::onDocumentRangeFormatting');
  return new server.ResponseError(-1, "onDocumentRangeFormatting not implemented", undefined);
});

connection.onDocumentSymbol((_args) => {
  Debug.info('server::onDocumentSymbol');
  return new server.ResponseError(-1, "onDocumentSymbols not implemented", undefined);
});

connection.onExit((_args) => {
  Debug.info('server::onExit');
});

connection.onHover((_args) => {
  Debug.info('server::onHover');
  return new server.ResponseError(-1, "onHover not implemented", undefined);
});

connection.onInitialize((): server.InitializeResult => {
  Debug.info('server::onInitialize');
  return {
    capabilities: {
      textDocumentSync: docManager.syncKind,
    },
  }
});

connection.onReferences((_args) => {
  Debug.info('server::onReference');
  return new server.ResponseError(-1, "onReferences not implemented", undefined);
});

connection.onRenameRequest((_args) => {
  Debug.info('server::onRenameRequest');
  return new server.ResponseError(-1, "onRenameRequest not implemented", undefined);
});

docManager.onDidChangeContent((_args) => {
  Debug.info('server::onDidChangeContent');
});

docManager.listen(connection);
connection.listen();

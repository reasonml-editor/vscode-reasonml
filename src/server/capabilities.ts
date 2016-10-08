import * as server from "vscode-languageserver";

const capabilities: server.ServerCapabilities = {
  codeLensProvider: {
    resolveProvider: true,
  },
  completionProvider: {
    resolveProvider: true,
    triggerCharacters: ["."],
  },
  definitionProvider: true,
  documentFormattingProvider: true,
  documentHighlightProvider: true,
  documentRangeFormattingProvider: true,
  documentSymbolProvider: true,
  hoverProvider: true,
  referencesProvider: true,
  renameProvider: true,
  textDocumentSync: server.TextDocumentSyncKind.Incremental,
};

export default capabilities;

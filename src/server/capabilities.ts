import * as server from "vscode-languageserver";

const capabilities: server.ServerCapabilities = {
  codeLensProvider: {
    resolveProvider: true,
  },
  completionProvider: {
    resolveProvider: true,
    triggerCharacters: [".", "#"],
  },
  definitionProvider: true,
  documentFormattingProvider: true,
  documentSymbolProvider: true,
  hoverProvider: true,
  textDocumentSync: server.TextDocumentSyncKind.Full,
};

export default capabilities;

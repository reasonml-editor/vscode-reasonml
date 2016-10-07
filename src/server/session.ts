import * as merlin from "./process/merlin";
import * as _ from "lodash";
import * as server from "vscode-languageserver";
import * as types from "vscode-languageserver-types";

export class Synchronizer extends server.TextDocuments {
  constructor(session: Session) {
    super();
    this.onDidChangeContent(async (event) => {
      const request = merlin.Sync.tell("start", "end", event.document.getText());
      await session.merlin.sync(request, event.document.uri);
      session.diagnosticsRefresh(event);
    });
    this.onDidClose(async (event) => {
      session.diagnosticsClear(event);
    });
    this.onDidOpen(async (event) => {
      const request = merlin.Sync.tell("start", "end", event.document.getText());
      await session.merlin.sync(request, event.document.uri);
      session.diagnosticsRefresh(event);
    });
    this.onDidSave(async (event) => {
      session.diagnosticsRefresh(event);
    });
    return this;
  }
}

export class Session {
  readonly connection: server.IConnection = server.createConnection(
    new server.IPCMessageReader(process),
    new server.IPCMessageWriter(process),
  );
  readonly merlin = new merlin.Session();
  readonly synchronizer: Synchronizer;

  diagnosticsRefresh = _.debounce(async (event: types.TextDocumentChangeEvent): Promise<void> => {
    const errorResponse = await this.merlin.query(merlin.Query.errors(), event.document.uri);
    if (errorResponse.class !== "return") return;
    const diagnostics = errorResponse.value.map(merlin.ErrorReport.intoCode);
    const uri = event.document.uri;
    this.connection.sendDiagnostics({ diagnostics, uri });
  }, 500);

  constructor() {
    this.synchronizer = new Synchronizer(this);
    return this;
  }

  diagnosticsClear(event: types.TextDocumentChangeEvent): void {
    const diagnostics = [];
    const uri = event.document.uri;
    this.connection.sendDiagnostics({ diagnostics, uri });
  }

  listen() {
    this.synchronizer.listen(this.connection);
    this.connection.listen();
  }
}

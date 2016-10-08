import * as merlin from "../shared/merlin";
import * as types from "../shared/types";
import * as processes from "./processes";
import * as _ from "lodash";
import * as server from "vscode-languageserver";

export class Synchronizer {
  private session: Session;
  constructor(session: Session) {
    this.session = session;
    return this;
  }
  listen() {
    this.session.connection.onDidCloseTextDocument((event) => {
      this.session.diagnosticsClear(event.textDocument);
    });

    this.session.connection.onDidOpenTextDocument(async (event) => {
      const request = merlin.Sync.tell("start", "end", event.textDocument.text);
      await this.session.merlin.sync(request, event.textDocument.uri);
      this.session.diagnosticsRefresh(event.textDocument);
    });

    this.session.connection.onDidChangeTextDocument(async (event) => {
      for (const change of event.contentChanges) {
        if (change && change.range) {
          const startPos = merlin.Position.fromCode(change.range.start);
          const endPos = merlin.Position.fromCode(change.range.end);
          const request = merlin.Sync.tell(startPos, endPos, change.text);
          await this.session.merlin.sync(request, event.textDocument.uri);
        }
      }
      this.session.diagnosticsRefresh(event.textDocument);
    });
  }
}

export class Session {
  readonly connection: server.IConnection = server.createConnection(
    new server.IPCMessageReader(process),
    new server.IPCMessageWriter(process),
  );
  readonly merlin = new processes.Merlin();
  readonly synchronizer: Synchronizer;

  constructor() {
    this.synchronizer = new Synchronizer(this);
    return this;
  }

  diagnosticsRefresh = _.debounce(async (event: types.TextDocumentIdentifier): Promise<void> => { // tslint:disable-line
    const errorResponse = await this.merlin.query(merlin.Query.errors(), event.uri);
    if (errorResponse.class !== "return") return;
    const diagnostics = errorResponse.value.map(merlin.ErrorReport.intoCode);
    this.connection.sendDiagnostics({ diagnostics, uri: event.uri });
  }, 500, { trailing: true });

  diagnosticsClear(event: types.TextDocumentIdentifier): void {
    const diagnostics = [];
    const uri = event.uri;
    this.connection.sendDiagnostics({ diagnostics, uri });
  }

  listen() {
    this.synchronizer.listen();
    this.connection.listen();
  }
}

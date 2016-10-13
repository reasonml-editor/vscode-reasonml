import * as merlin from "../shared/merlin";
import * as method from "./method";
import * as types from "../shared/types";
import * as processes from "./processes";
import * as _ from "lodash";
import * as server from "vscode-languageserver";

export class Diagnostics {
  private session: Session;

  constructor(session: Session) {
    this.session = session;
    return this;
  }

  clear(event: types.TextDocumentIdentifier): void {
    const diagnostics = [];
    const uri = event.uri;
    this.session.connection.sendDiagnostics({ diagnostics, uri });
  }

  refreshDebounced = _.debounce(async (event: types.TextDocumentIdentifier) => {
    const response = await this.session.merlin.query(merlin.Query.errors(), event.uri);
    if (response.class !== "return") return;
    const diagnostics = response.value.map(merlin.ErrorReport.intoCode);
    this.session.connection.sendDiagnostics({ diagnostics, uri: event.uri });
  }, 500, { trailing: true });

  async refresh(event: types.TextDocumentIdentifier): Promise<void> {
    const document = await method.getTextDocument(this.session, event);
    const request = merlin.Sync.tell("start", "end", document.content);
    await this.session.merlin.sync(request, event.uri);
    const response = await this.session.merlin.query(merlin.Query.errors(), event.uri);
    if (response.class !== "return") return;
    const diagnostics = response.value.map(merlin.ErrorReport.intoCode);
    this.session.connection.sendDiagnostics({ diagnostics, uri: event.uri });
  }

  async refreshWorkspace(event: types.TextDocumentIdentifier): Promise<void> {
    const workspaceMods = await method.getModules(this.session, event);
    for (const uri of workspaceMods) this.refresh(uri);
  }
}

export class Synchronizer {
  private session: Session;

  constructor(session: Session) {
    this.session = session;
    return this;
  }

  listen() {
    this.session.connection.onDidCloseTextDocument((event) => {
      this.session.diagnostics.clear(event.textDocument);
    });

    this.session.connection.onDidOpenTextDocument(async (event): Promise<void> => {
      const request = merlin.Sync.tell("start", "end", event.textDocument.text);
      await this.session.merlin.sync(request, event.textDocument.uri);
      this.session.diagnostics.refreshWorkspace(event.textDocument);
    });

    this.session.connection.onDidChangeTextDocument(async (event): Promise<void> => {
      for (const change of event.contentChanges) {
        if (change && change.range) {
          const startPos = merlin.Position.fromCode(change.range.start);
          const endPos = merlin.Position.fromCode(change.range.end);
          const request = merlin.Sync.tell(startPos, endPos, change.text);
          await this.session.merlin.sync(request, event.textDocument.uri);
        }
      }
      this.session.diagnostics.refreshDebounced(event.textDocument);
    });

    this.session.connection.onDidSaveTextDocument(async (event): Promise<void> => {
      this.session.diagnostics.refreshWorkspace(event.textDocument);
    });
  }
}

export class Session {
  readonly connection: server.IConnection = server.createConnection(
    new server.IPCMessageReader(process),
    new server.IPCMessageWriter(process),
  );
  readonly diagnostics: Diagnostics;
  readonly merlin = new processes.Merlin();
  readonly synchronizer: Synchronizer;

  constructor() {
    this.diagnostics = new Diagnostics(this);
    this.synchronizer = new Synchronizer(this);
    return this;
  }

  listen() {
    this.synchronizer.listen();
    this.connection.listen();
  }
}

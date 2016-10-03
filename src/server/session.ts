import * as merlin from "./process/merlin";
import * as server from "vscode-languageserver";
import * as types from "vscode-languageserver-types";

export class Synchronizer extends server.TextDocuments {
  constructor(session: Session) {
    super();
    this.onDidChangeContent(async (event) => {
      const request = merlin.command.Sync.tell("start", "end", event.document.getText());
      await session.merlin.sync(request, event.document.uri);
      session.diagnosticsRefresh(event);
    });
    this.onDidClose(async (event) => {
      session.diagnosticsClear(event);
    });
    this.onDidOpen(async (event) => {
      const request = merlin.command.Sync.tell("start", "end", event.document.getText());
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
  private readonly synchronizer: Synchronizer;
  private readonly config: {
    diagnostics: {
      delay: number;
    };
  } = {
    diagnostics: {
      delay: 250,
    },
  };
  private readonly symbol: {
    timeout: {
      diagnostics: symbol;
    };
  } = {
    timeout: {
      diagnostics: Symbol(),
    },
  };

  constructor() {
    this.synchronizer = new Synchronizer(this);
    return this;
  }

  async diagnosticsClear(event: types.TextDocumentChangeEvent): Promise<void> {
    this.connection.sendDiagnostics({
      diagnostics: [],
      uri: event.document.uri,
    });
  }

  async diagnosticsRefresh(event: types.TextDocumentChangeEvent): Promise<void> {
    this.diagnosticsClear(event);
    const handle = this.symbol.timeout.diagnostics;
    const object: { [key: string]: number } = event.document as any;
    clearTimeout(object[handle]);
    object[handle] = setTimeout(async () => {
      const errorResponse = await this.merlin.query(merlin.command.Query.errors(), event.document.uri);
      if (errorResponse.class === "return") {
        const diagnostics = errorResponse.value.map(merlin.data.ErrorReport.intoCode);
        this.connection.sendDiagnostics({ uri: event.document.uri, diagnostics });
      }
    }, this.config.diagnostics.delay);
  }

  listen() {
    this.synchronizer.listen(this.connection);
    this.connection.listen();
  }
}

import { merlin, types } from "../shared";
import * as command from "./command";
import * as processes from "./processes";
import * as _ from "lodash";
import * as server from "vscode-languageserver";

export class Diagnostics {
  public refreshImmediate: ((event: types.TextDocumentIdentifier) => Promise<void>);
  public refreshDebounced: ((event: types.TextDocumentIdentifier) => Promise<void>) & _.Cancelable;
  private session: Session;

  constructor(session: Session) {
    this.session = session;
    this.onDidChangeConfiguration();
    return this;
  }

  clear(event: types.TextDocumentIdentifier): void {
    this.session.connection.sendDiagnostics({
      diagnostics: [],
      uri: event.uri,
    });
  }

  onDidChangeConfiguration(): void {
    this.refreshImmediate = this.refreshWithKind(server.TextDocumentSyncKind.Full);
    this.refreshDebounced = _.debounce(
      this.refreshWithKind(server.TextDocumentSyncKind.Incremental),
      this.session.settings.reason.debounce.linter,
      { trailing: true },
    );
  }

  refreshWithKind(syncKind: server.TextDocumentSyncKind): (event: types.TextDocumentIdentifier) => Promise<void> {
    return async ({ uri }) => {
      const document = await command.getTextDocument(this.session, { uri });
      if (syncKind === server.TextDocumentSyncKind.Full) {
        await this.session.merlin.sync(
          merlin.Sync.tell("start", "end", document.getText()),
          uri,
        );
      }
      const errors = await this.session.merlin.query(
        merlin.Query.errors(),
        uri,
      );
      if (errors.class !== "return") return;
      const diagnostics = errors.value.map(merlin.ErrorReport.intoCode);
      this.session.connection.sendDiagnostics({ diagnostics, uri });
    };
  }

  async refreshWorkspace(event: types.TextDocumentIdentifier): Promise<void> {
    const workspaceMods = await command.getModules(this.session, event);
    for (const uri of workspaceMods) this.refreshImmediate(uri);
  }
}

export class Synchronizer {
  private session: Session;

  constructor(session: Session) {
    this.session = session;
    return this;
  }

  listen(): void {
    this.session.connection.onDidCloseTextDocument((event) => {
      this.session.diagnostics.clear(event.textDocument);
    });

    this.session.connection.onDidOpenTextDocument(async (event): Promise<void> => {
      const request = merlin.Sync.tell("start", "end", event.textDocument.text);
      await this.session.merlin.sync(request, event.textDocument.uri);
      this.session.diagnostics.refreshImmediate(event.textDocument);
      // this.session.diagnostics.refreshWorkspace(event.textDocument);
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
      this.session.diagnostics.refreshImmediate(event.textDocument);
      // this.session.diagnostics.refreshWorkspace(event.textDocument);
    });
  }

  onDidChangeConfiguration(): void {
    return;
  }
}

export interface ISettings {
  reason: {
    debounce: {
      linter: number;
    };
    path: {
      ocamlfind: string;
      ocamlmerlin: string;
      opam: string;
      rebuild: string;
      refmt: string;
      refmterr: string;
      rtop: string;
    };
    server: {
      languages: ("ocaml" | "reason")[];
    };
  };
}

export class Session {
  public settings: ISettings = {
    reason: {
      debounce: {
        linter: 500,
      },
      path: {
        ocamlfind: "ocamlfind",
        ocamlmerlin: "ocamlmerlin",
        opam: "opam",
        rebuild: "rebuild",
        refmt: "refmt",
        refmterr: "refmterr",
        rtop: "rtop",
      },
      server: {
        languages: [ "reason" ],
      },
    },
  };
  readonly connection: server.IConnection = server.createConnection(
    new server.IPCMessageReader(process),
    new server.IPCMessageWriter(process),
  );
  readonly diagnostics: Diagnostics;
  readonly merlin = new processes.Merlin(this.settings);
  readonly synchronizer: Synchronizer;

  constructor() {
    this.diagnostics = new Diagnostics(this);
    this.synchronizer = new Synchronizer(this);
    return this;
  }

  listen(): void {
    this.synchronizer.listen();
    this.connection.listen();
  }

  log(data: any): void {
    this.connection.console.log(JSON.stringify(data, null as any, 2)); // tslint:disable-line
  }

  onDidChangeConfiguration({ settings }: server.DidChangeConfigurationParams): void {
    this.settings = settings;
    this.diagnostics.onDidChangeConfiguration();
    this.synchronizer.onDidChangeConfiguration();
  }
}

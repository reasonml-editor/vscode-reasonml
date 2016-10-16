import { merlin, remote, types } from "../shared";
// import * as command from "./command";
import * as processes from "./processes";
import { Glob } from "glob";
import * as _ from "lodash";
import * as path from "path";
import Loki = require("lokijs");
import * as rpc from "vscode-jsonrpc";
import * as server from "vscode-languageserver";

/**
 * Index for outline metadata
 */
export class Index {
  public populated: boolean = false;
  private readonly db: Loki = new Loki(".vscode.reasonml.loki");
  private readonly symbols: LokiCollection<types.SymbolInformation>;
  private session: Session;

  constructor(session: Session) {
    this.session = session;
    this.symbols = this.db.addCollection<types.SymbolInformation>("symbols", {
      indices: [ "name" ],
    });
    return this;
  }

  public findSymbols(query: LokiQuery): types.SymbolInformation[] {
    let result: types.SymbolInformation[] = [];
    try {
      result = this.symbols.chain().find(query).simplesort("name").data();
    } catch (err) {
      //
    }
    return result;
  }

  public async indexSymbols({ uri }: types.TextDocumentIdentifier): Promise<void | server.ResponseError<void>> {
    const request = merlin.Query.outline();
    const response = await this.session.merlin.query(request, uri);
    if (response.class !== "return") return new rpc.ResponseError(-1, "refreshSymbolsForUri: failed", undefined);
    for (const item of merlin.Outline.intoCode(response.value, uri)) {
      const prefix = item.containerName ? `${item.containerName}.` : "";
      item.name = `${prefix}${item.name}`;
      item.containerName = path.relative(this.session.initConf.rootPath, uri.substr(5));
      this.symbols.insert(item);
    }
  };

  public async populate(origin: types.TextDocumentIdentifier): Promise<void> {
    if (!this.populated) {
      this.populated = true;
      const modules = await this.session.getModules(origin);
      for (const id of modules) {
        if (/\.(ml|re)i$/.test(id.uri)) continue;
        const data = await this.session.connection.sendRequest(remote.client.giveTextDocument, id);
        await this.session.merlin.sync(merlin.Sync.tell("start", "end", data.content), id.uri);
        await this.refreshSymbols(id);
      }
    }
  }

  public refreshSymbols(id: types.TextDocumentIdentifier): Promise<void | server.ResponseError<void>> {
    this.removeSymbols(id);
    return this.indexSymbols(id);
  }

  public removeSymbols({ uri }: types.TextDocumentIdentifier): void {
    this.symbols
      .chain()
      .where((item) => item.location.uri === uri)
      .remove();
  }
}

/**
 * Diagnostics manager for the session.
 */
export class Diagnostics {
  public refreshImmediate: ((event: types.TextDocumentIdentifier) => Promise<void>);
  public refreshDebounced: ((event: types.TextDocumentIdentifier) => Promise<void>) & _.Cancelable;
  private session: Session;

  constructor(session: Session) {
    this.session = session;
    this.onDidChangeConfiguration();
    return this;
  }

  public clear(event: types.TextDocumentIdentifier): void {
    this.session.connection.sendDiagnostics({
      diagnostics: [],
      uri: event.uri,
    });
  }

  public onDidChangeConfiguration(): void {
    this.refreshImmediate = this.refreshWithKind(server.TextDocumentSyncKind.Full);
    this.refreshDebounced = _.debounce(
      this.refreshWithKind(server.TextDocumentSyncKind.Incremental),
      this.session.settings.reason.debounce.linter,
      { trailing: true },
    );
  }

  public refreshWithKind(syncKind: server.TextDocumentSyncKind): (event: types.TextDocumentIdentifier) => Promise<void> {
    return async (id) => {
      const data = await this.session.connection.sendRequest(remote.client.giveTextDocument, id);
      if (syncKind === server.TextDocumentSyncKind.Full) {
        await this.session.merlin.sync(merlin.Sync.tell("start", "end", data.content), id.uri);
      }
      const errors = await this.session.merlin.query(merlin.Query.errors(), id.uri);
      if (errors.class !== "return") return;
      const diagnostics = errors.value.map(merlin.ErrorReport.intoCode);
      this.session.connection.sendDiagnostics({ diagnostics, uri: id.uri });
    };
  }

  // public async refreshWorkspace(event: types.TextDocumentIdentifier): Promise<void> {
  //   const workspaceMods = await command.getModules(this.session, event);
  //   for (const uri of workspaceMods) this.refreshImmediate(uri);
  // }
}

/**
 * Document synchronizer for the session.
 */
export class Synchronizer {
  private session: Session;

  constructor(session: Session) {
    this.session = session;
    return this;
  }

  public listen(): void {
    this.session.connection.onDidCloseTextDocument((event) => {
      this.session.diagnostics.clear(event.textDocument);
    });

    this.session.connection.onDidOpenTextDocument(async (event): Promise<void> => {
      const request = merlin.Sync.tell("start", "end", event.textDocument.text);
      await this.session.merlin.sync(request, event.textDocument.uri);
      this.session.diagnostics.refreshImmediate(event.textDocument);
      // this.session.index.refreshSymbols(event.textDocument);
      await this.session.index.populate(event.textDocument);
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

  public onDidChangeConfiguration(): void {
    return;
  }
}

/**
 * Structured configuration settings for the session.
 */
export interface ISettings {
  reason: {
    codelens: {
      unicode: boolean;
    };
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

/**
 * Manager for the session. Launched on client connection.
 */
export class Session {
  public initConf: server.InitializeParams;
  public settings: ISettings = {
    reason: {
      codelens: {
        unicode: true,
      },
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
  public readonly connection: server.IConnection = server.createConnection(
    new server.IPCMessageReader(process),
    new server.IPCMessageWriter(process),
  );
  public readonly diagnostics: Diagnostics;
  public readonly index: Index;
  public readonly merlin = new processes.Merlin(this.settings);
  public readonly synchronizer: Synchronizer;

  constructor() {
    this.index = new Index(this);
    this.diagnostics = new Diagnostics(this);
    this.synchronizer = new Synchronizer(this);
    return this;
  }

  public async getModules(event: server.TextDocumentIdentifier): Promise<server.TextDocumentIdentifier[]> {
    const request = merlin.Query.path.list.source();
    const response = await this.merlin.query(request, event.uri);
    if (response.class !== "return") return [];
    const projectDirs: Set<string> = new Set();
    const projectMods: server.TextDocumentIdentifier[] = [];
    for (const cwd of response.value) {
      if (cwd && !(/\.opam\b/.test(cwd) || projectDirs.has(cwd))) {
        projectDirs.add(cwd);
        const mods = new Glob("*.re?(i)", { cwd, realpath: true, sync: true }).found;
        for (const mod of mods) {
          const uri = `file://${mod}`;
          projectMods.push({ uri });
        }
      }
    }
    return projectMods;
  }

  public listen(): void {
    this.synchronizer.listen();
    this.connection.listen();
  }

  log(data: any): void {
    this.connection.console.log(JSON.stringify(data, null as any, 2)); // tslint:disable-line
  }

  public onDidChangeConfiguration({ settings }: server.DidChangeConfigurationParams): void {
    this.settings = settings;
    this.diagnostics.onDidChangeConfiguration();
    this.synchronizer.onDidChangeConfiguration();
  }
}

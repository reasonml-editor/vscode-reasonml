import { merlin, types } from "../../shared";
import * as command from "../command";
import Session from "./index";
// import * as path from "path";
import Loki = require("lokijs");
import * as rpc from "vscode-jsonrpc";
import * as server from "vscode-languageserver";

/**
 * Index for outline metadata
 */
export default class Indexer {
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

  public dispose(): void {
    return;
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

  public async indexSymbols(id: types.TextDocumentIdentifier): Promise<void | server.ResponseError<void>> {
    const request = merlin.Query.outline();
    const response = await this.session.merlin.query(request, id);
    if (response.class !== "return") return new rpc.ResponseError(-1, "indexSymbols: failed", undefined);
    for (const item of merlin.Outline.intoCode(response.value, id)) {
      const prefix = item.containerName ? `${item.containerName}.` : "";
      item.name = `${prefix}${item.name}`;
      item.containerName = this.session.environment.relativize(id);
      this.symbols.insert(item);
    }
  };

  public async initialize(): Promise<void> {
    return;
  }

  public async populate(origin: types.TextDocumentIdentifier): Promise<void> {
    if (!this.populated) {
      this.populated = true;
      const modules = await command.getModules(this.session, origin);
      for (const id of modules) {
        if (/\.(ml|re)i$/.test(id.uri)) continue;
        const document = await command.getTextDocument(this.session, id);
        await this.session.merlin.sync(merlin.Sync.tell("start", "end", document.getText()), id);
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

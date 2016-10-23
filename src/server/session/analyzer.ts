import { merlin, types } from "../../shared";
import * as command from "../command";
import Session from "./index";
import * as _ from "lodash";
import * as server from "vscode-languageserver";

/**
 * Diagnostics manager for the session.
 */
export default class Analyzer {
  public refreshImmediate: ((event: types.TextDocumentIdentifier) => Promise<void>);
  public refreshDebounced: ((event: types.TextDocumentIdentifier) => Promise<void>) & _.Cancelable;
  private session: Session;

  constructor(session: Session) {
    this.session = session;
    return this;
  }

  public clear(event: types.TextDocumentIdentifier): void {
    this.session.connection.sendDiagnostics({
      diagnostics: [],
      uri: event.uri,
    });
  }

  public dispose(): void {
    return;
  }

  public async initialize(): Promise<void> {
    this.onDidChangeConfiguration();
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
      if (syncKind === server.TextDocumentSyncKind.Full) {
        const document = await command.getTextDocument(this.session, id);
        await this.session.merlin.sync(merlin.Sync.tell("start", "end", document.getText()), id);
      }
      const errors = await this.session.merlin.query(merlin.Query.errors(), id);
      if (errors.class !== "return") return;
      const diagnostics = errors.value.map(merlin.ErrorReport.intoCode);
      this.session.connection.sendDiagnostics({ diagnostics, uri: id.uri });
    };
  }
}

import { merlin } from "../../shared";
import Session from "./index";

/**
 * Document synchronizer for the session.
 */
export default class Synchronizer {
  private session: Session;

  constructor(session: Session) {
    this.session = session;
    return this;
  }

  public dispose(): void {
    return;
  }

  public async initialize(): Promise<void> {
    return;
  }

  public listen(): void {
    this.session.connection.onDidCloseTextDocument((event) => {
      this.session.analyzer.clear(event.textDocument);
    });

    this.session.connection.onDidOpenTextDocument(async (event): Promise<void> => {
      const request = merlin.Sync.tell("start", "end", event.textDocument.text);
      await this.session.merlin.sync(request, event.textDocument, Infinity);
      this.session.analyzer.refreshImmediate(event.textDocument);
      // this.session.indexer.refreshSymbols(event.textDocument);
      await this.session.indexer.populate(event.textDocument);
      // this.session.analyzer.refreshWorkspace(event.textDocument);
    });

    this.session.connection.onDidChangeTextDocument(async (event): Promise<void> => {
      for (const change of event.contentChanges) {
        if (change && change.range) {
          const startPos = merlin.Position.fromCode(change.range.start);
          const endPos = merlin.Position.fromCode(change.range.end);
          const request = merlin.Sync.tell(startPos, endPos, change.text);
          await this.session.merlin.sync(request, event.textDocument, Infinity);
        }
      }
      this.session.analyzer.refreshDebounced(event.textDocument);
    });

    this.session.connection.onDidSaveTextDocument(async (event): Promise<void> => {
      this.session.analyzer.refreshImmediate(event.textDocument);
      // this.session.analyzer.refreshWorkspace(event.textDocument);
    });
  }

  public onDidChangeConfiguration(): void {
    return;
  }
}

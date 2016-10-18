import { types } from "../../shared";
import Session from "./index";
import * as path from "path";
import * as URL from "url";

const fileSchemeLength = "file://".length - 1;

export default class Environment {
  public static pathToUri(path: string): types.TextDocumentIdentifier {
    const uri = URL.format(URL.parse(`file://${path}`));
    return { uri };
  }

  public static uriToPath({ uri }: types.TextDocumentIdentifier): string {
    return uri.substr(fileSchemeLength);
  }

  private readonly session: Session;

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

  public relativize(id: types.TextDocumentIdentifier): string {
    return path.relative(this.workspaceRoot(), Environment.uriToPath(id));
  }

  public workspaceRoot(): string {
    return this.session.initConf.rootPath;
  }
}

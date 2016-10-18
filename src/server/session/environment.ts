import { types } from "../../shared";
import Session from "./index";
import * as fs from "fs";
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

  public isRebelProject: boolean = false;
  private readonly session: Session;

  constructor(session: Session) {
    this.session = session;
    return this;
  }

  public dispose(): void {
    return;
  }

  public async initialize(): Promise<void> {
    await this.detectRebelProject();
  }

  public relativize(id: types.TextDocumentIdentifier): string {
    return path.relative(this.workspaceRoot(), Environment.uriToPath(id));
  }

  public workspaceRoot(): string {
    return this.session.initConf.rootPath;
  }

  private async detectRebelProject(): Promise<void> {
    const pkgPath = `${this.workspaceRoot()}/package.json`;
    try {
      let isRebelProject = true;
      const pkg: any = await new Promise((res, rej) => fs.readFile(pkgPath, (err, data) => err ? rej(err) : res(JSON.parse(data.toString()))));
      // tslint:disable
      isRebelProject = isRebelProject && pkg["dependencies"] != null;
      isRebelProject = isRebelProject && pkg["dependencies"]["rebel"] != null;
      // tslint:enable
      this.isRebelProject = isRebelProject;
    } catch (err) {
      //
    }
    // FIXME: should also reflect this in the status item
  }
}

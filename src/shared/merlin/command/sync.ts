import * as ordinal from "../ordinal";

export class Sync<I, O> {
  sync: I;
  constructor(sync: I) {
    void undefined as any as O; // tslint:disable-line:no-unused-expression
    this.sync = sync;
    return this;
  }
}

export namespace Sync {
  // protocol
  export namespace protocol {
    export namespace version {
      export const get = () => new Sync<
        ["protocol", "version"],
        { selected: number; latest: number; merlin: string }
        >(["protocol", "version"]);
      export const set = (version: number) => new Sync<
        ["protocol", "version", number],
        { selected: number; latest: number; merlin: string }
        >(["protocol", "version", version]);
    }
  }

  // tell
  export const tell = (startPos: ordinal.Position, endPos: ordinal.Position, source: string) => new Sync<
    ["tell", ordinal.Position, ordinal.Position, string],
    undefined
    >(["tell", startPos, endPos, source]);
}

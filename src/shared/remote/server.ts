import * as rpc from "vscode-jsonrpc";
import * as merlin from "../merlin";
import * as types from "../types";

export const giveCaseAnalysis =
  new rpc.RequestType<types.TextDocumentRange, Promise<null | merlin.Case.Destruct>, void, void>("reason.server.giveCaseAnalysis");

export const giveMerlinFiles =
  new rpc.RequestType<types.TextDocumentIdentifier, Promise<string[]>, void, void>("reason.server.giveMerlinFiles");

export const giveFormatted =
  new rpc.RequestType<types.UnformattedTextDocument, Promise<null | string>, void, void>("reason.server.giveFormatted");

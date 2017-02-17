import * as rpc from "vscode-jsonrpc";
import * as merlin from "../merlin";
import * as types from "../types";

export const giveCaseAnalysis: rpc.RequestType<types.TextDocumentRange, Promise<null | merlin.Case.Destruct>, void> = {
  method: "reason.server.giveCaseAnalysis",
};

export const giveMerlinFiles: rpc.RequestType<types.TextDocumentIdentifier, Promise<string[]>, void> = {
  method: "reason.server.giveMerlinFiles",
};

export const giveFormatted: rpc.RequestType<types.UnformattedTextDocument, Promise<null | string>, void> = {
  method: "reason.server.giveFormatted",
};

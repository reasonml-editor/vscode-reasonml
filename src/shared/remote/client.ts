import * as types from "../types";
import * as rpc from "vscode-jsonrpc";
import * as client from "vscode-languageclient";

export const givePrefix: rpc.RequestType<client.TextDocumentPositionParams, null | string, void> = {
  method: "reason.client.givePrefix",
};

export const giveTextDocument: rpc.RequestType<client.TextDocumentIdentifier, types.TextDocumentData, void> = {
  method: "reason.client.giveTextDocument",
};

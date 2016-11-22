import * as rpc from "vscode-jsonrpc";
import * as client from "vscode-languageclient";
import * as types from "../types";

export const givePrefix: rpc.RequestType<client.TextDocumentPositionParams, null | string, void> = {
  method: "reason.client.givePrefix",
};

export const giveText: rpc.RequestType<client.Location, string, void> = {
  method: "reason.client.giveText",
};

export const giveTextDocument: rpc.RequestType<client.TextDocumentIdentifier, types.TextDocumentData, void> = {
  method: "reason.client.giveTextDocument",
};

export const giveWordAtPosition: rpc.RequestType<types.ILocatedPosition, string, void> = {
  method: "reason.client.giveWordAtPosition",
};

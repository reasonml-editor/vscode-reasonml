import * as rpc from "vscode-jsonrpc";
import * as client from "vscode-languageclient";
import * as types from "../types";

export const givePrefix =
  new rpc.RequestType<client.TextDocumentPositionParams, null | string, void, void>("reason.client.givePrefix");

export const giveText =
  new rpc.RequestType<client.Location, string, void, void>("reason.client.giveText");

export const giveTextDocument =
  new rpc.RequestType<client.TextDocumentIdentifier, types.TextDocumentData, void, void>("reason.client.giveTextDocument");

export const giveWordAtPosition =
  new rpc.RequestType<types.ILocatedPosition, string, void, void>("reason.client.giveWordAtPosition");

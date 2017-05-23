import * as json from "./json";

export interface IMerlinNotification {
  section: string;
  message: string;
}

export type MerlinResponse<T> = {
  class: "return";
  value: T;
  notifications: IMerlinNotification;
} | {
  class: "failure";
  value: string;
  notifications: IMerlinNotification;
} | {
  class: "error";
  value: string;
  notifications: IMerlinNotification;
} | {
  class: "exception";
  value: json.Value;
  notifications: IMerlinNotification;
};

export type Response<T> = Promise<MerlinResponse<T>>;

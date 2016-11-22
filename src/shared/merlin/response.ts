import * as json from "./json";

export type MerlinNotification = {
  section: string;
  message: string;
};

export type MerlinResponse<T> = {
  class: "return";
  value: T;
  notifications: MerlinNotification;
} | {
  class: "failure";
  value: string;
  notifications: MerlinNotification;
} | {
  class: "error";
  value: string;
  notifications: MerlinNotification;
} | {
  class: "exception";
  value: json.Value;
  notifications: MerlinNotification;
};

export type Response<T> = Promise<MerlinResponse<T>>;

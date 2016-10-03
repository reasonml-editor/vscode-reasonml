export interface IArray extends Array<Value> {
}

export interface IObject {
  [key: string]: Value;
}

export type Value
  = boolean
  | IArray
  | IObject
  | number
  | string
  ;

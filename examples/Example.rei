type t 'a =
  | Nil
  | Cons 'a (t 'a)
  ;

let nil: t 'a;
let cons: 'a => t 'a => t 'a;
let append: t 'a => t 'a => t 'a;
let from: list 'a => t 'a;

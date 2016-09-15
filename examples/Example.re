let module List: {
  type t 'a =
    | Nil
    | Cons 'a (t 'a)
    ;
  let nil: t 'a;
  let cons: 'a => t 'a => t 'a;
  let append: t 'a => t 'a => t 'a;
} = {
  type t 'a =
    | Nil
    | Cons 'a (t 'a)
    ;
  let nil = Nil;
  let cons x xs => Cons x xs;
  let rec append xs ys =>
    switch xs {
    | Nil => ys
    | Cons x xs => Cons x (append xs ys)
    };
};

let module List: {
  type t 'a =
    | Nil
    | Cons 'a (t 'a)
    ;
} = {
  type t =
    | Nil
    | Cons 'a (t 'a)
    ;
  let nil = Nil;
  let cons x xs => Cons x xs;
  let rec append xs ys =>
    switch (xs, ys) {
    | (Nil, ys) => ys
    | (Cons x xs, ys) => Cons x (append xs ys)
    };
};

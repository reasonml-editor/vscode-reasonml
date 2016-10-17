open Cats;
open TyCon;

let module Pre = {
  type t 'a = GenClone.prependable 'a;
  let of_gen xs => xs |> GenMList.of_gen |> GenMList.to_clonable |> GenClone.to_prependable;
  let of_list xs => Gen.of_list xs |> of_gen;
  let map f xs => Gen.map f xs#gen |> of_gen;
  let empty () => Gen.empty |> of_gen;
  let singleton a => Gen.singleton a |> of_gen;
  let append xs ys => Gen.append xs#gen ys#gen |> of_gen;
  let splits xs => {
    let fst f (x, y) => (f x, y);
    let snd f (x, y) => (x, f y);
    let rec go xs =>
      switch (Gen.next xs#gen) {
      | None => singleton (empty (), empty ())
      | Some x =>
        append
          (map (fst (fun ys => { ys#prepend x; ys })) (go xs#clone))
          (map (snd (fun ys => { ys#prepend x; ys })) (go xs#clone))
      };
    go xs
  };
};

let module Seq = {
  type t 'a = GenClone.clonable 'a;
  let of_gen xs => xs |> GenMList.of_gen |> GenMList.to_clonable;
  let of_pre (xs: Pre.t 'a) => xs#gen |> of_gen;
  let of_list xs => Gen.of_list xs |> of_gen;
  let to_list xs => xs#gen |> Gen.to_list;
  let map f xs => GenClone.map f xs;
  let empty () => Gen.empty |> of_gen;
  let singleton a => Gen.singleton a |> of_gen;
  let append xs ys => Gen.append xs#gen ys#gen |> of_gen;
  let interleave xs ys => Gen.interleave xs#gen ys#gen |> of_gen;
  let permutations xs => Gen.permutations xs#gen |> of_gen;
  let splits xs => xs#gen
    |> Pre.of_gen
    |> Pre.splits
    |> Pre.map (fun (x, y) => (of_pre x, of_pre y))
    |> of_pre;
};

module type Enum = {
  let module T: TC1;
  let enum: Seq.t 'a => Seq.t (T.el 'a);
  let to_list: Seq.t (ap 'a T.co) => list (T.el 'a);
};

type enum 'f = (module Enum with type T.co = 'f);

module type Pack = {
  include Enum;
  let pack: enum T.co;
};

let module Void: {
  type t 'a;
  let module T: TC1 with type el 'a = t 'a;
  include Pack with module T := T;
} = {
  let module Def = {
    type t 'a;
    let module T = TC1 { type nonrec t 'a = t 'a };
    let enum xs => Seq.empty ();
    let to_list xs => Seq.map T.el xs |> Seq.to_list;
  };
  include Def;
  let pack: enum Def.T.co = (module Def);
};

let module Unit: {
  type t 'a = Unit;
  let module T: TC1 with type el 'a = t 'a;
  include Pack with module T := T;
} = {
  let module Def = {
    type t 'a = Unit;
    let module T = TC1 { type nonrec t 'a = t 'a; };
    let enum xs =>
      switch (Gen.next xs#gen) {
      | None => Seq.singleton Unit
      | Some _ => Seq.empty ()
      };
    let to_list xs => Seq.map T.el xs |> Seq.to_list;
  };
  include Def;
  let pack: enum Def.T.co = (module Def);
};

let module Add (F: Pack) (G: Pack): {
  type t 'a =
    | Inl (F.T.el 'a)
    | Inr (G.T.el 'a);
  let module T: TC1 with type el 'a = t 'a;
  include Pack with module T := T;
} => {
  let module Def = {
    type t 'a =
      | Inl (F.T.el 'a)
      | Inr (G.T.el 'a);
    let module T = TC1 { type nonrec t 'a = t 'a };
    let enum xs => {
      let lhs = Seq.map (fun x => Inl x) (F.enum xs#clone);
      let rhs = Seq.map (fun x => Inr x) (G.enum xs#clone);
      Seq.interleave lhs rhs
    };
    let to_list xs => Seq.map T.el xs |> Seq.to_list;
  };
  include Def;
  let pack: enum Def.T.co = (module Def);
};

let module Mul (F: Pack) (G: Pack): {
  type t 'a = (F.T.el 'a, G.T.el 'a);
  let module T: TC1 with type el 'a = t 'a;
  include Pack with module T := T;
} => {
  let module Def = {
    type t 'a = (F.T.el 'a, G.T.el 'a);
    let module T = TC1 { type nonrec t 'a = t 'a };
    let enum xs => {
      let go0 (fls, gls) => {
        let go1 x => {
          let go2 y => Gen.singleton (x, y);
          Gen.flat_map go2 (G.enum gls)#gen
        };
        Gen.flat_map go1 (F.enum fls)#gen
      };
      Gen.flat_map go0 (Seq.splits xs)#gen |> Seq.of_gen
    };
    let to_list xs => Seq.map T.el xs |> Seq.to_list;
  };
  include Def;
  let pack: enum Def.T.co = (module Def);
};

let module Sing: {
  type t 'a = X 'a;
  let module T: TC1 with type el 'a = t 'a;
  include Pack with module T := T;
} = {
  let module Def = {
    type t 'a = X 'a;
    let module T = TC1 {
      type nonrec t 'a = t 'a;
    };
    let enum xs =>
      switch (Gen.next xs#gen) {
      | None => Seq.empty ()
      | Some x =>
        switch (Gen.next xs#gen) {
        | None => Seq.singleton (X x)
        | Some y => Seq.empty ()
        }
      };
    let to_list xs => Seq.map T.el xs |> Seq.to_list;
  };
  include Def;
  let pack: enum Def.T.co = (module Def);
};

let module Linear: {
  type t 'a = list 'a;
  let module T: TC1 with type el 'a = t 'a;
  include Pack with module T := T;
} = {
  let module Def = {
    type t 'a = list 'a;
    let module T = TC1 { type nonrec t 'a = t 'a };
    let enum = Seq.permutations;
    let to_list xs => Seq.map T.el xs |> Seq.to_list;
  };
  include Def;
  let pack: enum Def.T.co = (module Def);
};

let module Species = {
  let enum (type f) (e: enum f) xs => {
    let module E = (val e);
    Seq.map E.T.co (E.enum xs)
  };
};

let module Test = {
  let ex0: list (Void.t int) =
    Species.enum Void.pack (Seq.of_list [0, 1, 2, 3, 4]) |> Void.to_list;
  let ex1: list (Sing.t int) =
    Species.enum Sing.pack (Seq.of_list [0, 1, 2, 3, 4]) |> Sing.to_list;
  let ex2: list (Sing.t int) = Species.enum Sing.pack (Seq.singleton 2) |> Sing.to_list;
  let ex3: list (Add(Linear)(Void).t int) = {
    let module M = Add Linear Void;
    Species.enum M.pack (Seq.of_list [0, 1]) |> M.to_list
  };
  let ex4: list (Mul(Linear)(Void).t int) = {
    let module M = Mul Linear Void;
    Species.enum M.pack (Seq.of_list [0, 1]) |> M.to_list
  };
  let ex5: list (Mul(Unit)(Linear).t int) = {
    let module M = Mul Unit Linear;
    Species.enum M.pack (Seq.of_list [0, 1]) |> M.to_list
  };
  let ex6: list (Add(Linear)(Mul(Unit)(Linear)).t int) = {
    let module M = Add Linear(Mul Unit Linear);
    Species.enum M.pack (Seq.of_list [0, 1, 2]) |> M.to_list
  };
  /* output:
         [ M.Inl [2; 1; 0]
         ; M.Inr (Unit, [2; 1; 0])
         ; M.Inl [1; 2; 0]
         ; M.Inr (Unit, [1; 2; 0])
         ; M.Inl [1; 0; 2]
         ; M.Inr (Unit, [1; 0; 2])
         ; M.Inl [2; 0; 1]
         ; M.Inr (Unit, [2; 0; 1])
         ; M.Inl [0; 2; 1]
         ; M.Inr (Unit, [0; 2; 1])
         ; M.Inl [0; 1; 2]
         ; M.Inr (Unit, [0; 1; 2])
         ]
     */
};

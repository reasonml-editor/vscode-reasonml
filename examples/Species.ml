open Cats
open TyCon

module Pre =
struct
  type 'a t = 'a GenClone.prependable

  let of_gen xs = xs
    |> GenMList.of_gen
    |> GenMList.to_clonable
    |> GenClone.to_prependable

  let of_list xs =
    Gen.of_list xs
    |> of_gen

  let map f xs =
    Gen.map f xs#gen
    |> of_gen

  let empty () =
    Gen.empty
    |> of_gen

  let singleton a =
    Gen.singleton a
    |> of_gen

  let append xs ys =
    Gen.append xs#gen ys#gen
    |> of_gen

  let splits xs =
    let fst f (x, y) = (f x, y) in
    let snd f (x, y) = (x, f y) in
    let rec go xs =
      match Gen.next xs#gen with
      | None ->
        singleton ((empty (), empty ()))
      | Some(x) ->
        append
          (map (fst (fun ys -> ys#prepend x; ys)) (go xs#clone))
          (map (snd (fun ys -> ys#prepend x; ys)) (go xs#clone)) in
    go xs
end

module Seq =
struct
  type 'a t = 'a GenClone.clonable

  let of_gen xs = xs
    |> GenMList.of_gen
    |> GenMList.to_clonable

  let of_pre (xs : 'a Pre.t) =
    xs#gen
    |> of_gen

  let of_list xs =
    Gen.of_list xs
    |> of_gen

  let to_list xs =
    xs#gen
    |> Gen.to_list

  let map f xs =
    GenClone.map f xs

  let empty () =
    Gen.empty
    |> of_gen

  let singleton a =
    Gen.singleton a
    |> of_gen

  let append xs ys =
    Gen.append xs#gen ys#gen
    |> of_gen

  let interleave xs ys =
    Gen.interleave xs#gen ys#gen
    |> of_gen

  let permutations xs =
    Gen.permutations xs#gen
    |> of_gen

  let splits xs =
    xs#gen
    |> Pre.of_gen
    |> Pre.splits
    |> Pre.map (fun (x, y) -> (of_pre x, of_pre y))
    |> of_pre
end

module type Enum =
sig
  module T : TC1
  val enum : 'a Seq.t -> 'a T.el Seq.t
  val to_list : ('a, T.co) ap Seq.t -> 'a T.el list
end
(*type 'f enum = (module Enum with type T.co = 'f)*)

module type Pack =
sig
  include Enum
  val pack : T.co enum
end

module Void :
sig
  type 'a t
  module T : TC1 with type 'a el = 'a t
  include Pack with module T := T
end =
struct
  module Def =
  struct
    type 'a t
    module T = TC1(struct type nonrec 'a t = 'a t end)
    let enum xs = Seq.empty ()
    let to_list xs = Seq.map T.el xs |> Seq.to_list
  end
  include Def
  let pack : Def.T.co enum = (module Def)
end

module Unit :
sig
  type 'a t = Unit
  module T : TC1 with type 'a el = 'a t
  include Pack with module T := T
end =
struct
  module Def =
  struct
    type 'a t = Unit
    module T = TC1(struct type nonrec 'a t = 'a t end)
    let enum xs =
      match Gen.next xs#gen with
      | None -> Seq.singleton Unit
      | Some(_) -> Seq.empty ()
    let to_list xs = Seq.map T.el xs |> Seq.to_list
  end
  include Def
  let pack : Def.T.co enum = (module Def)
end

module Add (F : Pack) (G : Pack) :
sig
  type 'a t =
    | Inl of 'a F.T.el
    | Inr of 'a G.T.el
  module T : TC1 with type 'a el = 'a t
  include Pack with module T := T
end =
struct
  module Def =
  struct
    type 'a t =
      | Inl of 'a F.T.el
      | Inr of 'a G.T.el
    module T = TC1(struct type nonrec 'a t = 'a t end)
    let enum xs =
      let lhs = Seq.map (fun x -> Inl x) (F.enum xs#clone) in
      let rhs = Seq.map (fun x -> Inr x) (G.enum xs#clone) in
      Seq.interleave lhs rhs
    let to_list xs = Seq.map T.el xs |> Seq.to_list
  end
  include Def
  let pack : Def.T.co enum = (module Def)
end

module Mul (F : Pack) (G : Pack) :
sig
  type 'a t = 'a F.T.el * 'a G.T.el
  module T : TC1 with type 'a el = 'a t
  include Pack with module T := T
end =
struct
  module Def =
  struct
    type 'a t = 'a F.T.el * 'a G.T.el
    module T = TC1(struct type nonrec 'a t = 'a t end)

    let enum xs =
      let go0 (fls, gls) =
        let go1 x =
          let go2 y =
            Gen.singleton (x, y) in
          Gen.flat_map go2 (G.enum gls)#gen in
        Gen.flat_map go1 (F.enum fls)#gen in
      Gen.flat_map go0 (Seq.splits xs)#gen
      |> Seq.of_gen

    let to_list xs = Seq.map T.el xs |> Seq.to_list
  end
  include Def
  let pack : Def.T.co enum = (module Def)
end

module Sing :
sig
  type 'a t = X of 'a
  module T : TC1 with type 'a el = 'a t
  include Pack with module T := T
end =
struct
  module Def =
  struct
    type 'a t = X of 'a
    module T = TC1(struct type nonrec 'a t = 'a t end)
    let enum xs =
      begin
        match Gen.next xs#gen with
        | None -> Seq.empty ()
        | Some(x) ->
          begin
            match Gen.next xs#gen with
            | None ->
              Seq.singleton (X(x))
            | Some(y) ->
              Seq.empty ()
          end
      end
    let to_list xs = Seq.map T.el xs |> Seq.to_list
  end
  include Def
  let pack : Def.T.co enum = (module Def)
end

module Linear :
sig
  type 'a t = 'a list
  module T : TC1 with type 'a el = 'a t
  include Pack with module T := T
end =
struct
  module Def =
  struct
    type 'a t = 'a list
    module T = TC1(struct type nonrec 'a t = 'a t end)
    let enum = Seq.permutations
    let to_list xs = Seq.map T.el xs |> Seq.to_list
  end
  include Def
  let pack : Def.T.co enum = (module Def)
end

module Species =
struct
  let enum (type f) (e : f enum) xs =
    let module E = (val e) in
    Seq.map E.T.co (E.enum xs)
end

module Test =
struct
  let ex0 : int Void.t list =
    Species.enum Void.pack (Seq.of_list [0; 1; 2; 3; 4])
    |> Void.to_list

  let ex1 : int Sing.t list =
    Species.enum Sing.pack (Seq.of_list [0; 1; 2; 3; 4])
    |> Sing.to_list

  let ex2 : int Sing.t list =
    Species.enum Sing.pack (Seq.singleton 2)
    |> Sing.to_list

  let ex3 : int Add(Linear)(Void).t list =
    let module M = Add(Linear)(Void) in
    Species.enum M.pack (Seq.of_list [0; 1])
    |> M.to_list

  let ex4 : int Mul(Linear)(Void).t list =
    let module M = Mul(Linear)(Void) in
    Species.enum M.pack (Seq.of_list [0; 1])
    |> M.to_list

  let ex5 : int Mul(Unit)(Linear).t list =
    let module M = Mul(Unit)(Linear) in
    Species.enum M.pack (Seq.of_list [0; 1])
    |> M.to_list

  let ex6 : int Add(Linear)(Mul(Unit)(Linear)).t list =
    let module M = Add(Linear)(Mul(Unit)(Linear)) in
    Species.enum M.pack (Seq.of_list [0; 1; 2])
    |> M.to_list

    (* output:
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
    *)
end

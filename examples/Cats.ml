open TyCon

(* The Sig module collects structure signatures. *)

module type INITIAL = sig
  type t
  val gnab : t -> 'a
end
type 't initial = (module INITIAL with type t = 't)

module type TERMINAL = sig
  type t
  val bang : 'a -> t
end
type 't terminal = (module TERMINAL with type t = 't)

module type LEIBNIZ = sig
  type ('a, 'b) t
  val nope : ('a, 'a) t
  val subst : 'f tc1 -> ('a, 'b) t -> (('a, 'f) ap -> ('b, 'f) ap)
end

module type APART = sig
  module I : INITIAL
  module L : LEIBNIZ
  type ('a, 'b) t = ('a, 'b) L.t -> I.t
end

module type UNIVERSAL = sig
  module T : TC1
  type poly = { ap : 'x. 'x T.el }
  type t
  val into : poly -> t
  val from : t -> poly
end
type 'f universal = (module UNIVERSAL with type T.co = 'f)

module type EXISTENTIAL = sig
  module T : TC1
  type 'r elim = { ap : 'x. 'x T.el -> 'r }
  type t
  val into : 'a T.el -> t
  val from : t -> ('r elim -> 'r)
end
type 'f existential = (module EXISTENTIAL with type T.co = 'f)

module type SEMIGROUP = sig
  module T : TC0
  val op : T.el -> T.el -> T.el
end
type 't semigroup = (module SEMIGROUP with type T.el = 't)

module type MONOID = sig
  include SEMIGROUP
  val unit : T.el
end
type 't monoid = (module MONOID with type T.el = 't)

module type SEMIRING = sig
  module T : TC0
  val zero : T.el
  val add : T.el -> T.el -> T.el
  val one : T.el
  val mul : T.el -> T.el -> T.el
end
type 't semiring = (module SEMIRING with type T.el = 't)

module type MODULOSEMIRING = sig
  include SEMIRING
  val div : T.el -> T.el -> T.el
  val modulo : T.el -> T.el -> T.el
end
type 't modulosemiring = (module MODULOSEMIRING with type T.el = 't)

module type RING = sig
  include SEMIRING
  val sub : T.el -> T.el -> T.el
end
type 't ring = (module RING with type T.el = 't)

module type DIVISIONRING = sig
  include RING
  include MODULOSEMIRING with module T := T
end
type 't divisionring = (module DIVISIONRING with type T.el = 't)

module type FUNCTOR = sig
  module T : TC1
  val map : ('a -> 'b) -> ('a T.el -> 'b T.el)
end
type 'f functor' = (module FUNCTOR with type T.co = 'f)

module type BIFUNCTOR = sig
  module T : TC2
  val bimap : ('a -> 'b) -> ('c -> 'd) -> (('a, 'c) T.el -> ('b, 'd) T.el)
end
type 'f bifunctor = (module BIFUNCTOR with type T.co = 'f)

module type PRESHEAF = sig
  module T : TC1
  val premap : ('a -> 'b) -> ('b T.el -> 'a T.el)
end
type 'f presheaf = (module PRESHEAF with type T.co = 'f)

module type PROFUNCTOR = sig
  module T : TC2
  val dimap : ('a -> 'b) -> ('c -> 'd) -> (('b, 'c) T.el -> ('a, 'd) T.el)
end
type 'p profunctor = (module PROFUNCTOR with type T.co = 'p)

module type SEMIGROUPOID = sig
  include PROFUNCTOR
  val compose : ('b, 'c) T.el -> ('a, 'b) T.el -> ('a, 'c) T.el
end
type 'hom semigroupoid = (module SEMIGROUPOID with type T.co = 'hom)

module type CATEGORY = sig
  include PROFUNCTOR
  val id : ('a, 'a) T.el
end
type 'hom category = (module CATEGORY with type T.co = 'hom)

module type END = sig
  module Hom : PROFUNCTOR
  type poly = { ap : 'x. ('x, 'x) Hom.T.el }
  type t
  val into : poly -> t
  val from : t -> poly
end
type 'p end' = (module END with type Hom.T.co = 'p)

module type COEND = sig
  module Hom : PROFUNCTOR
  type 'r elim = { ap : 'x. ('x, 'x) Hom.T.el -> 'r }
  type t
  val into : ('a, 'a) Hom.T.el -> t
  val from : t -> ('r elim -> 'r)
end
type 'p coend = (module COEND with type Hom.T.co = 'p)

module type TRANSFORM = sig
  module F : FUNCTOR
  module G : FUNCTOR
  type t = { ap : 'x. 'x F.T.el -> 'x G.T.el }
end
type ('f, 'g) transform = (module TRANSFORM with type F.T.co = 'f and type G.T.co = 'g)

 (*pullback (along J) *)
module type PULLBACK = sig
  module J : TC1
  (* J↑* f ≅ f ∘ J *)
  type ('x, 'f) t = ('x J.el, 'f) ap
end
type 'j pullback = (module PULLBACK with type J.co = 'j)

(* left adjoint to the pullback (along J) *)
module type LAN = sig
  module J : TC1
  module G : TC1
  (* J↑* F ≅ F ∘ J *)
  module AlongJ : PULLBACK with module J = J
  (* Lan J G ⊣ J↑* *)
  type 'a lan = Lan : ('x J.el -> 'a) * 'x G.el -> 'a lan
  module L : TC1 with type 'a el = 'a lan
  type 'f lhs = { lhs : 'x. 'x G.el -> ('x, 'f) AlongJ.t }
  type 'f rhs = { rhs : 'x. 'x L.el -> ('x, 'f) ap }
  (* (G ~> J↑* F) → (Lan J G ~> F) *)
  val into : 'f functor' -> 'f lhs -> 'f rhs
  (* (G ~> J↑* F) ← (Lan J G ~> F) *)
  val from : 'f functor' -> 'f rhs -> 'f lhs
end
type ('j, 'g) lan = (module LAN with type J.co = 'j and type G.co = 'g)

(* right adjoint to the pullback (along J) *)
module type RAN = sig
  module J : TC1
  module G : TC1
  (* J↑* F ≅ F ∘ J *)
  module AlongJ : PULLBACK with module J = J
  (* J↑* ⊣ Ran J G *)
  type 'a ran = { ran : 'x. ('a -> 'x J.el) -> 'x G.el }
  module R : TC1 with type 'a el = 'a ran
  type 'f lhs = { lhs : 'x. ('x, 'f) AlongJ.t -> 'x G.el }
  type 'f rhs = { rhs : 'x. ('x, 'f) ap -> 'x R.el }
  (* (J↑* F ~> G) → (F ~> Ran J G) *)
  val into : 'f functor' -> 'f lhs -> 'f rhs
  (* (J↑* F ~> G) ← (F ~> Ran J G) *)
  val from : 'f functor' -> 'f rhs -> 'f lhs
end
type ('j, 'g) ran = (module RAN with type J.co = 'j and type G.co = 'g)

module type COPRODUCT = sig
  include BIFUNCTOR
  val inl : 'a -> ('a, 'b) T.el
  val inr : 'b -> ('a, 'b) T.el
  val from : ('a -> 'x) -> ('b -> 'x) -> (('a, 'b) T.el -> 'x)
end
type 't coproduct = (module COPRODUCT with type T.co = 't)

module type PRODUCT = sig
  include BIFUNCTOR
  val fst : ('a, 'b) T.el -> 'a
  val snd : ('a, 'b) T.el -> 'b
  val into : ('x -> 'a) -> ('x -> 'b) -> ('x -> ('a, 'b) T.el)
end
type 't product = (module PRODUCT with type T.co = 't)

module type APPLY = sig
  include FUNCTOR
  val apply : ('a -> 'b) T.el -> ('a T.el -> 'b T.el)
end
type 'f apply = (module APPLY with type T.co = 'f)

module type APPLICATIVE = sig
  include APPLY
  val pure : 'a -> 'a T.el
end
type 'f applicative = (module APPLICATIVE with type T.co = 'f)

module type BIND = sig
  include APPLY
  val bind : 'a T.el -> ('a -> 'b T.el) -> 'b T.el
end
type 'm bind = (module BIND with type T.co = 'm)

module type MONAD = sig
  include APPLICATIVE
  include BIND with module T := T
end
type 'm monad = (module MONAD with type T.co = 'm)

module type EXTEND = sig
  include FUNCTOR
  val extend : 'a T.el -> ('a T.el -> 'b) -> 'b T.el
end
type 'w extend = (module EXTEND with type T.co = 'w)

module type COMONAD = sig
  include EXTEND
  val extract : 'a T.el -> 'a
end
type 'w comonad = (module COMONAD with type T.co = 'w)

module type FOLDABLE = sig
  module T : TC1
  val fold_map : 'm monoid -> ('a -> 'm) -> ('a T.el -> 'm)
end
type 'f foldable = (module FOLDABLE with type T.co = 'f)

module type TRAVERSABLE = sig
  include FUNCTOR
  include FOLDABLE with module T := T
  val traverse : 'm applicative -> ('a -> ('b, 'm) ap) -> ('a T.el -> ('b T.el, 'm) ap)
end
type 'f traversable = (module TRAVERSABLE with type T.co = 'f)

module type BIAPPLY = sig
  include BIFUNCTOR
  val biapply : ('a -> 'b, 'c -> 'd) T.el -> ('a, 'c) T.el -> ('b, 'd) T.el
end
type 'f biapply = (module BIAPPLY with type T.co = 'f)

module type BIAPPLICATIVE = sig
  include BIAPPLY
  val bipure : 'a -> 'b -> ('a, 'b) T.el
end
type 'f biapplicative = (module BIAPPLICATIVE with type T.co = 'f)

module type BIFOLDABLE = sig
  module T : TC2
  val bifold_map : 'm monoid -> ('a -> 'm) -> ('b -> 'm) -> (('a, 'b) T.el -> 'm)
end
type 'f bifoldable = (module BIFOLDABLE with type T.co = 'f)

module type BITRAVERSABLE = sig
  include BIFUNCTOR
  include BIFOLDABLE with module T := T
  val bitraverse : 'm applicative -> ('a -> ('c, 'm) ap) -> ('b -> ('d, 'm) ap) -> (('a, 'b) T.el -> (('c, 'd) T.el, 'm) ap)
end
type 'f bitraversable = (module BITRAVERSABLE with type T.co = 'f)

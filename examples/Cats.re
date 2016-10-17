open TyCon;

/* The Sig module collects structure signatures. */
module type INITIAL = {
  type t;
  let gnab: t => 'a;
};
type initial 't = (module INITIAL with type t = 't);

module type TERMINAL = {
  type t;
  let bang: 'a => t;
};
type terminal 't = (module TERMINAL with type t = 't);

module type LEIBNIZ = {
  type t 'a 'b;
  let refl: t 'a 'a;
  let subst: tc1 'f => t 'a 'b => (ap 'f 'a => ap 'f 'b);
};

module type APART = {
  let module I: INITIAL;
  let module L: LEIBNIZ;
  type t 'a 'b = L.t 'a 'b => I.t;
};

module type UNIVERSAL = {
  let module T: TC1;
  type poly = { ap: 'x. T.el 'x };
  type t;
  let into: poly => t;
  let from: t => poly;
};
type universal 'f = (module UNIVERSAL with type T.co = 'f);

module type EXISTENTIAL = {
  let module T: TC1;
  type elim 'r = { ap: 'x. T.el 'x => 'r };
  type t;
  let into: T.el 'a => t;
  let from: t => elim 'r => 'r;
};
type existential 'f = (module EXISTENTIAL with type T.co = 'f);

module type SEMIGROUP = {
  let module T: TC0;
  let op: T.el => T.el => T.el;
};
type semigroup 't = (module SEMIGROUP with type T.el = 't);

module type MONOID = {
  include SEMIGROUP;
  let unit: T.el;
};
type monoid 't = (module MONOID with type T.el = 't);

module type SEMIRING = {
  let module T: TC0;
  let zero: T.el;
  let add: T.el => T.el => T.el;
  let one: T.el;
  let mul: T.el => T.el => T.el;
};
type semiring 't = (module SEMIRING with type T.el = 't);

module type MODULOSEMIRING = {
  include SEMIRING;
  let div: T.el => T.el => T.el;
  let modulo: T.el => T.el => T.el;
};
type moduloSemiring 't = (module MODULOSEMIRING with type T.el = 't);

module type RING = {
  include SEMIRING;
  let sub: T.el => T.el => T.el;
};
type ring 't = (module RING with type T.el ='t);

module type DIVISIONRING = {
  include RING;
  include MODULOSEMIRING with module T := T;
};
type divisionring 't = (module DIVISIONRING with type T.el = 't);

module type FUNCTOR = {
  let module T: TC1;
  let map: ('a => 'b) => (T.el 'a => T.el 'b);
};
type functor' 'f = (module FUNCTOR with type T.co = 'f);

module type BIFUNCTOR = {
  let module T: TC2;
  let bimap: ('a => 'b) => ('c => 'd) => (T.el 'a 'c => T.el 'b 'd);
};
type bifunctor 'f = (module BIFUNCTOR with type T.co = 'f);

module type PRESHEAF = {
  let module T: TC1;
  let premap: ('a => 'b) => T.el 'b => T.el 'a;
};
type presheaf 'f = (module PRESHEAF with type T.co = 'f);

module type PROFUNCTOR = {
  let module T: TC2;
  let dimap: ('a => 'b) => ('c => 'd) => (T.el 'b 'c => T.el 'a 'd);
};
type profunctor 'p = (module PROFUNCTOR with type T.co = 'p);

module type SEMIGROUPOID = {
  include PROFUNCTOR;
  let compose: T.el 'b 'c => T.el 'a 'b => T.el 'a 'c;
};
type semigroupoid 'hom = (module SEMIGROUPOID with type T.co = 'hom);

module type CATEGORY = {
  include PROFUNCTOR;
  let id: T.el 'a 'a;
};
type category 'hom = (module CATEGORY with type T.co = 'hom);

module type END = {
  let module Hom: PROFUNCTOR;
  type poly = { ap: 'x. Hom.T.el 'x 'x };
  type t;
  let into: poly => t;
  let from: t => poly;
};
type end' 'p = (module END with type Hom.T.co = 'p);

module type COEND = {
  let module Hom: PROFUNCTOR;
  type elim 'r = { ap: 'x. Hom.T.el 'x 'x => 'r };
  type t;
  let into: Hom.T.el 'a 'a => t;
  let from: t => elim 'r => 'r;
};
type coend 'p = (module COEND with type Hom.T.co = 'p);

module type TRANSFORM = {
  let module F: FUNCTOR;
  let module G: FUNCTOR;
  type t = { ap: 'x .F.T.el 'x => G.T.el 'x };
};
type transform 'f 'g = (module TRANSFORM with type F.T.co = 'f and type G.T.co = 'g);

/* pullback (along J) */
module type PULLBACK = {
  let module J: TC1;
  /* J↑* f ≅ f ∘ J */
  type t 'f 'x = ap 'f (J.el 'x);
};
type pullback 'j = (module PULLBACK with type J.co = 'j);

/* left adjoint to the pullback (along J) */
module type LAN = {
  let module J: TC1;
  let module G: TC1;
  /* J↑* F ≅ F ∘ J */
  let module AlongJ: PULLBACK with module J = J;
  /* Lan J G ⊣ J↑* */
  type lan 'a =
    | Lan (J.el 'x => 'a) (G.el 'x): lan 'a;
  let module L: TC1 with type el 'a = lan 'a;
  type lhs 'f = { lhs: 'x. G.el 'x => AlongJ.t 'f 'x };
  type rhs 'f = { rhs: 'x. L.el 'x => ap 'f 'x };
  /* (G ~> J↑* F) → (Lan J G ~> F) */
  let into: functor' 'f => lhs 'f => rhs 'f;
  /* (G ~> J↑* F) ← (Lan J G ~> F) */
  let from: functor' 'f => rhs 'f => lhs 'f;
};
type lan 'j 'g = (module LAN with type J.co = 'j and type G.co = 'g);

/* right adjoint to the pullback (along J) */
module type RAN = {
  let module J: TC1;
  let module G: TC1;
  /* J↑* F ≅ F ∘ J */
  let module AlongJ: PULLBACK with module J = J;
  /* J↑* ⊣ Ran J G */
  type ran 'a = { ran: 'x. ('a => J.el 'x) => G.el 'x };
  let module R: TC1 with type el 'a = ran 'a;
  type lhs 'f = { lhs: 'x. AlongJ.t 'f 'x => G.el 'x };
  type rhs 'f = { rhs: 'x. ap 'f 'x => R.el 'x };
  /* (J↑* F ~> G) → (F ~> Ran J G) */
  let into: functor' 'f => lhs 'f => rhs 'f;
  /* (J↑* F ~> G) ← (F ~> Ran J G) */
  let from: functor' 'f => rhs 'f => lhs 'f;
};
type ran 'j 'g = (module RAN with type J.co = 'j and type G.co = 'g);

module type COPRODUCT = {
  include BIFUNCTOR;
  let inl: 'a => T.el 'a 'b;
  let inr: 'b => T.el 'a 'b;
  let from: ('a => 'x) => ('b => 'x) => T.el 'a 'b => 'x;
};
type coproduct 't = (module COPRODUCT with type T.co = 't);

module type PRODUCT = {
  include BIFUNCTOR;
  let fst: T.el 'a 'b => 'a;
  let snd: T.el 'a 'b => 'b;
  let into: ('x => 'a) => ('x => 'b) => 'x => T.el 'a 'b;
};
type product 't = (module PRODUCT with type T.co = 't);

module type APPLY = {
  include FUNCTOR;
  let apply: T.el ('a => 'b) => T.el 'a => T.el 'b;
};
type apply 'f = (module APPLY with type T.co = 'f);

module type APPLICATIVE = {
  include APPLY;
  let pure: 'a => T.el 'a;
};
type applicative 'f = (module APPLICATIVE with type T.co = 'f);

module type BIND = {
  include APPLY;
  let bind: T.el 'a => ('a => T.el 'b) => T.el 'b;
};
type bind 'm = (module BIND with type T.co = 'm);

module type MONAD = {
  include APPLICATIVE;
  include BIND with module T := T;
};
type monad 'm = (module MONAD with type T.co = 'm);

module type EXTEND = {
  include FUNCTOR;
  let extend: T.el 'a => (T.el 'a => 'b) => T.el 'b;
};
type extend 'w = (module EXTEND with type T.co = 'w);

module type COMONAD = {
  include EXTEND;
  let extract: T.el 'a => 'a;
};
type comonad 'w = (module COMONAD with type T.co = 'w);

module type FOLDABLE = {
  let module T: TC1;
  let fold_map: monoid 'm => ('a => 'm) => T.el 'a => 'm;
};
type foldable 'f = (module FOLDABLE with type T.co = 'f);

module type TRAVERSABLE = {
  include FUNCTOR;
  include FOLDABLE with module T := T;
  let traverse: applicative 'm => ('a => ap 'm 'b) => T.el 'a => ap 'm (T.el 'b);
};
type traversable 'f = (module TRAVERSABLE with type T.co = 'f);

module type BIAPPLY = {
  include BIFUNCTOR;
  let biapply: T.el ('a => 'b) ('c => 'd) => (T.el 'a 'c => T.el 'b 'd);
};
type biapply 'f = (module BIAPPLY with type T.co = 'f);

module type BIAPPLICATIVE = {
  include BIAPPLY;
  let bipure: 'a => 'b => T.el 'a 'b;
};
type biapplicative 'f = (module BIAPPLICATIVE with type T.co = 'f);

module type BIFOLDABLE = {
  let module T: TC2;
  let bifold_map: monoid 'm => ('a => 'm) => ('b => 'm) => T.el 'a 'b => 'm;
};
type bifoldable 'f = (module BIFOLDABLE with type T.co = 'f);

module type BITRAVERSABLE = {
  include BIFUNCTOR;
  include BIFOLDABLE with module T := T;
  let bitraverse: applicative 'm => ('a => ap 'm 'c) => ('b => ap 'm 'd) => T.el 'a 'b => ap 'm (T.el 'c 'd);
};
type bitraversable 'f = (module BITRAVERSABLE with type T.co = 'f);

# vscode-reasonml

Reason support for Visual Studio Code

![screenshot](https://github.com/freebroccolo/vscode-reasonml/raw/master/assets/screenshot.png)

## Getting Started

### Editor Configuration

- VS Code [insiders build](https://code.visualstudio.com/insiders)
- [Flatland Monokai](https://marketplace.visualstudio.com/items?itemName=gerane.Theme-FlatlandMonokai) syntax theme
- [Reason](https://github.com/facebook/reason#contributing-to-development) (development build)

The insiders build is recommended for scrollable hovers with improved documentation formatting.

### Reason Configuration

For the moment, a recent development build of Reason is also recommended. Nothing is required apart
from the standard Reason install steps linked above. As long as `opam` is configured correctly and
`ocamlmerlin` is in your path, all features below should just work out of the box.

This extension relies heavily on [Merlin](https://github.com/the-lambda-church/merlin) though so you
will need to have your project set up for that in order to enable completion and hover info. See the
Merlin [wiki](https://github.com/the-lambda-church/merlin/wiki/project-configuration) for details on
how to do that. Basically you need to have a `.merlin` file in your project root which lists the
source directories, libraries, and extensions used.

## Status

- [x] advanced syntax highlighting
- [x] completion
- [x] linting
- [x] outline view for symbols (⇧⌘O)
- [x] type and documentation on hover
- [x] jump-to-definition (⌃+click or ⌘+hover)
- [x] case splitting (see below for details)
- [ ] formatting integration
- [ ] build tool integration
- [ ] debugger integration
- [ ] toplevel integration

### Case splitting

For the examples below, `<cursor>` represents the position of the current VS Code editor cursor.

#### Introducing a `switch`

In order to introduce a `switch`, execute the following steps:

1. select an identifier or move the cursor anywhere within its word range (as below)
2. open the palette (⇧⌘P) and run `Reason: case split` (typing `case` should pull it up)

##### Before
```
let foo (arg: list 'a) => a<cursor>rg;
```

##### After
```
let foo (arg: list 'a) => switch arg {
  | [] => failwith "<case>"
  | [_, ..._] => failwith "<case>"
};
```

#### Nesting `switch` expressions

The `switch` introduction functionality works with nested `switch` expressions:

##### Before
```
let foo (arg: list 'a) => switch arg {
  | [] => failwith "<case>"
  | [_, ...xs] => x<cursor>s
};
```

##### After
```
let foo (arg: list 'a) => switch arg {
  | [] => failwith "<case>"
  | [_, ...xs] => switch xs {
    | [] => failwith "<case>"
    | [_, ..._] => failwith "<case>"
  }
};
```

#### Splitting a pattern without introducing a `switch`

The case split feature can be used to split an existing pattern further:

##### Before
```
let foo (arg: list 'a) => switch arg {
  | [] => failwith "<case>"
  | [x, ...x<cursor>s] => failwith "<case>"
};
```

##### After
```
let foo (arg: list 'a) => switch arg {
  | [] => failwith "<case>"
  | [_] | [_, _, ..._] => failwith "<case>"
};
```

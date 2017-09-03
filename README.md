# vscode-reasonml

Reason support for Visual Studio Code

![screenshot](https://github.com/freebroccolo/vscode-reasonml/raw/master/assets/screenshot.png)

## Discussion

There is an `#editorsupport` channel on the Reason [discord server](https://discord.gg/reasonml). If you would like to discuss an idea or need help or have other feedback you can usually find me (@freebroccolo) idling there.

## Features

- highlighting
  - [x] advanced syntax highlighting for reason
  - [x] basic highlighting for merlin, ocamlbuild, and opam files

- editing
  - [x] document formatting (enable on save with `reason.formatOnSave`)
  - [x] completion and snippets
  - [x] [rename symbol](https://code.visualstudio.com/docs/editor/editingevolved#_rename-symbol) (F2 or right click)
  - [x] [case splitting](#case-splitting)

- navigation
  - [x] [symbol outline for buffers](https://code.visualstudio.com/docs/editor/editingevolved#_goto-symbol) (⇧⌘O) (type `:` in list to sort items)
  - [x] [symbol outline for project](https://code.visualstudio.com/docs/editor/editingevolved#_open-symbol-by-name) (⌘T) (supports regular expressions)
  - [x] [jump-to-definition](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-definition) (⌃+click) and [code preview](https://code.visualstudio.com/docs/editor/editingevolved#_peek) (⌘+hover)
  - [x] find references (⇧F12 or right click)

- static analysis
  - [x] merlin integration with incremental edit synchronization
  - [x] display types over definitions (disable with `editor.codeLens` setting)
  - [x] display types and markdown-rendered docs on hover
  - [x] [online linting and compiler diagnostics with suggested fixes](https://code.visualstudio.com/docs/editor/editingevolved#_errors-warnings)
    - ⇧⌘M to toggle diagnostics panel
    - F8 to loop through diagnostics for current file
    - Click on lightbulb icon for suggested fixes

## Getting Started

### Recommended Syntax Themes

Although syntax highlighting should display well in most themes we recommend and test with the following:

- [Atom One Dark](https://marketplace.visualstudio.com/items?itemName=freebroccolo.theme-atom-one-dark)
- Dark+ (default theme)
- [Dracula](https://marketplace.visualstudio.com/items?itemName=dracula-theme.theme-dracula)
- [Flatland Monokai](https://marketplace.visualstudio.com/items?itemName=gerane.Theme-FlatlandMonokai)
- [Oceanic Next](https://marketplace.visualstudio.com/items?itemName=naumovs.theme-oceanicnext)

### Reason Configuration

- [Reason](http://reasonml.github.io/guide/editor-tools/global-installation#recommended-through-npmyarn)

The Reason installation steps also installs Merlin for you, so you can skip the Merlin installation in the next section.

### Merlin Configuration

**Configured for you already if you've installed Reason above & plan to use it for JS compilation. Skip this step.**

This extension relies heavily on [merlin](https://github.com/the-lambda-church/merlin) so you will
need to have your project set up for that in order to enable completion and hover info. See the
Merlin [wiki](https://github.com/the-lambda-church/merlin/wiki/project-configuration) for details on
how to do that. Basically you need to have a `.merlin` file in your project root which lists the
source directories, libraries, and extensions used.

### Installation

**Note**: due to an existing problem, make sure that you're opening vscode from the [command-line](https://code.visualstudio.com/docs/setup/mac), at the root of your project!

Install this Visual Studio Code extension [just like any other extension](https://code.visualstudio.com/docs/editor/extension-gallery).

Search for `reasonml` and install `Reason <version> by Darin Morrison`.

To enable formatting on save, add the following to `Code > Preferences > Settings`:

```
{
  "reason.formatOnSave": true
}
```

## Advanced Features

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

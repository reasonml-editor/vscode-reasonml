**If you're on our default workflow, please try [this plugin](https://github.com/jaredly/reason-language-server) instead. Thanks!**

# vscode-reasonml

Reason support for Visual Studio Code

![screenshot](https://github.com/freebroccolo/vscode-reasonml/raw/master/assets/screenshot.png)

## Discussion

There is an `#editorsupport` channel on the Reason [discord server](https://discord.gg/reasonml). If you would like to discuss an idea or need help or have other feedback you can usually find me (@freebroccolo) idling there.

## Features

* highlighting

  * [x] advanced syntax highlighting for reason
  * [x] basic highlighting for merlin, ocamlbuild, and opam files

* editing

  * [x] document formatting (enable on save with `editor.formatOnSave`)
  * [x] completion and snippets
  * [x] [rename symbol](https://code.visualstudio.com/docs/editor/editingevolved#_rename-symbol) (F2 or right click)
  * [x] [case splitting](#case-splitting)

* navigation

  * [x] [symbol outline for buffers](https://code.visualstudio.com/docs/editor/editingevolved#_goto-symbol) (⇧⌘O) (type `:` in list to sort items)
  * [x] [symbol outline for project](https://code.visualstudio.com/docs/editor/editingevolved#_open-symbol-by-name) (⌘T) (supports regular expressions)
  * [x] [jump-to-definition](https://code.visualstudio.com/docs/editor/editingevolved#_go-to-definition) (⌃+click) and [code preview](https://code.visualstudio.com/docs/editor/editingevolved#_peek) (⌘+hover)
  * [x] find references (⇧F12 or right click)

* static analysis
  * [x] merlin integration with incremental edit synchronization
  * [x] display types over definitions (disable with `editor.codeLens` setting)
  * [x] display types and markdown-rendered docs on hover
  * [x] [online linting and compiler diagnostics with suggested fixes](https://code.visualstudio.com/docs/editor/editingevolved#_errors-warnings)
    * ⇧⌘M to toggle diagnostics panel
    * F8 to loop through diagnostics for current file
    * Click on lightbulb icon for suggested fixes
  * [x] built-in support for showing BuckleScript's [bsb](https://bucklescript.github.io/bucklescript/Manual.html#_bucklescript_build_system_code_bsb_code) errors inline, as a companion to merlin's diagnosis.

## Getting Started

### Configuration

Extension requires `ocamlmerlin-lsp` (and `ocamlmerlin-reason` if you are using Reason syntax) compatible with the project you are working with. Path to the binary can be specified with `reason.path.ocamlmerlin-lsp` key in your `.vscode/settings`:

```json
"reason.path.ocamlmerlin-dir": "_opam/bin/ocamlmerlin-lsp",
"reason.path.ocamlmerlin-reason": "_opam/bin/ocamlmerlin-reason"
```

#### esy

If you are using `esy`, you can use this configuration:

````json
"devDependencies": {
  "@opam/merlin-lsp": "*",
  "@opam/reason": "3.4.0", // if you are using reason
  "ocaml": "4.06.x" // version of compiler in your project
},
"resolutions": {
  "@opam/merlin-lsp": "ocaml/merlin:merlin-lsp.opam#f431006"
}

Then run `esy exec-command which ocamlmerlin-lsp` and `esy exec-command which ocamlmerlin-reason` to get paths to binaries.

#### bs-platfrom <= 5

Bucklescript 5 and earlier using `OCaml 4.02.3` and you will have problems with compliling `merlin-lsp`. But it can be solved with a couple of well placed pins:

```json
// esy.json
"devDependencies": {
  "@opam/merlin-lsp": "*",
  "@opam/reason": "3.4.0",
  "ocaml": "4.2.x"
},
"resolutions": {
  "@opam/ppx_deriving": {
    "source": "github:ocaml-ppx/ppx_deriving:opam#71e61a2",
    "override": {
      "build": ["ocaml pkg/build.ml native=true native-dynlink=true"]
    }
  },
  "@opam/merlin-lsp": "github:Khady/merlin:merlin-lsp.opam#9325d1d"
}
```

### Recommended Syntax Themes

Although syntax highlighting should display well in most themes we recommend and test with the following:

#### Default Themes

* Dark+ (_recommended_; this theme is the most thoroughly tested)

#### Other Themes

* [Atom One Dark](https://marketplace.visualstudio.com/items?itemName=freebroccolo.theme-atom-one-dark)
* [Dracula](https://marketplace.visualstudio.com/items?itemName=dracula-theme.theme-dracula)
* [Flatland Monokai](https://marketplace.visualstudio.com/items?itemName=gerane.Theme-FlatlandMonokai)
* [Oceanic Next](https://marketplace.visualstudio.com/items?itemName=naumovs.theme-oceanicnext)

### Configurations

#### Reason

* [Reason](https://reasonml.github.io/docs/en/installation)

The Reason installation steps also installs Merlin for you, so you can skip the Merlin installation in the next section.

#### Merlin

**Configured for you already if you've installed Reason above & plan to use it for JS compilation. Skip this step.**

This extension relies heavily on [merlin](https://github.com/the-lambda-church/merlin) so you will
need to have your project set up for that in order to enable completion and hover info. See the
Merlin [wiki](https://github.com/the-lambda-church/merlin/wiki/project-configuration) for details on
how to do that. Basically you need to have a `.merlin` file in your project root which lists the
source directories, libraries, and extensions used.

#### Bsb

You can optionally start [bsb](https://bucklescript.github.io/bucklescript/Manual.html#_bucklescript_build_system_code_bsb_code) from the editor itself, and have the command-line errors appear inside the editor. Add the following to `Code > Preferences > Settings`:

```reason
"reason.diagnostics.tools": [
  "merlin",
  "bsb"
]
````

Merlin's diagnosis is best-effort and can sometimes be wrong; bsb's diagnosis is 100% correct. **bsb diagnosis also works on Windows**.

### Installation

**Note**: due to an existing problem, make sure that you're opening vscode from the [command-line](https://code.visualstudio.com/docs/setup/mac), at the root of your project!

Install this Visual Studio Code extension [just like any other extension](https://code.visualstudio.com/docs/editor/extension-gallery).

Search for `reason` and install `OCaml and Reason IDE` by `Darin Morrison`.

To enable formatting on save, add the following to `Code > Preferences > Settings`:

```
{
  "editor.formatOnSave": true
}
```

If you want to enable [codelens](https://code.visualstudio.com/blogs/2017/02/12/code-lens-roundup), add the following to `Code > Preferences > Settings`:

```
"reason.codelens.enabled": true
```

## Advanced Features

### Case splitting

For the examples below, `<cursor>` represents the position of the current VS Code editor cursor.

#### Introducing a `switch`

In order to introduce a `switch`, execute the following steps:

1.  select an identifier or move the cursor anywhere within its word range (as below)
2.  open the palette (⇧⌘P) and run `Reason: case split` (typing `case` should pull it up)

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

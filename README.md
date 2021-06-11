# joshi

`joshi` is JavaScript Shell Script Interpreter

> Think of it as something similar to [Node.js](https://nodejs.org/) but with a
> different API, JavaScript engine (`joshi` uses 
> [Duktape](https://duktape.org/) instead of 
> [V8](https://nodejs.dev/learn/the-v8-javascript-engine)), and aiming at a
> different goal.

## Table of contents

1. [Comparison to Node.js or similar tools](#comparison-to-nodejs-or-similar-tools)
2. [How to install](#how-to-install)
3. [How to build the project](#how-to-build-the-project)
4. [Support](#support)
5. [Documentation](#documentation)
6. [Examples](#examples)

## Comparison to Node.js or similar tools

### Why you should use joshi instead of Node.js

The main reasons why `joshi` was created are:

1. It is by far much simpler than `Node.js`: this is because `Duktape` is just
   one C file implementing the whole JavaScript engine.
2. It is implemented with (almost) no dependencies: currently only `glibc`,
   `libxcrypt` and, optionally, `ncurses` are needed.
3. The API is designed to expose `POSIX`/`Linux` APIs: if you know how to use
   `POSIX` APIs, you know how to use `joshi`.
4. The programming model is not asynchronous: it uses the old `fork` process
   model (it doesn't even have/need threads yet).
5. Exposing a native API is as easy as creating a JSON file and running
   `joshpec`: this tool generates a stub so that you can call C functions from
   JavaScript.
6. It is very lightweight: because the core of `joshi` is `Duktape` and it's
   optimized for small systems, `joshi` is very lightweight, with a reasonable 
   performance.

### Why you shouldn't use joshi

Because `joshi` is something new you should not expect a lot of support or
goodies from the community.

Also, it is important to keep in mind that `joshi` is targeting `Linux` systems
for developing terminal tools or daemons. So, don't create web servers or any
other performance critical tool with it!

Finally, `Duktape` only supports `ECMAScript 5`, however there are plans to 
support `ECMAScript 6+` in the future. But for now, if you want to use
`ECMAScript 6+`, `TypeScript`, or similar languages, you need to transpile and
face the sadness of having to build, package and map (by hand, because `joshi`
does NOT support sourcemaps) the source lines of your code.

## How to install

For now, `joshi` can only be automatically installed in `ArchLinux`, using the
[AUR](https://aur.archlinux.org/packages/joshi).

> 👀 If you want to contribute or provide an installation for any other Linux
> distro, please file an issue or send a PR changing anything necessary to
> integrate it here.

## How to build the project

The project is easy to build. It has a C based part that must be compiled with
`gcc` and the rest is plain JavaScript. Even though the C part depends on the 
platform, the small set of dependencies needed makes it highly portable (as long
as it is compiled in a `POSIX`/`Linux` system).

For the time being it is not prepared to be compiled in `Windows` or `Mac`. In
theory it should be easy to port, but it is possible that the JavaScript APIs
may look unnatural in non-Linux systems (and especially in Windows). However,
the project is open to contribution for ports if someone finds it useful.

### Building the binary

The steps are quite easy. All you need is `make`, `gcc`, and two or three more
dependencies (you can see the list in the 
[PKGBUILD file](https://aur.archlinux.org/cgit/aur.git/tree/PKGBUILD?h=joshi),
section `makedepends`).

Once everything is installed, go to the project folder and simply run `make`.

That will invoke the `compile` target of [Makefile](./Makefile) which, in turn,
will build the binaries and put them in the `build/joshi` subfolder of the
project.

After that, you may test the recently built `joshi` binary by running
`make test`. If everything goes OK you will all tests green.

### Building the docs

To build the API docs just run `make docs`. That will leave the documentation 
built by [jsdoc](https://jsdoc.app/) in the `build/jsdoc` subfolder of the
project.

### Installing joshi manually

We recommend to use your distro's package manager to install `joshi` (as
explained in [How to install](#how-to-install)). However, if you want to make a
custom installation of `joshi` you may simply run
`PREFIX=/usr/local make install` with the `root` user (of course, you can change
`/usr/local` by `/usr`, `opt`, or any prefix you like).

That will install:

- The `joshi` command (at `$PREFIX/bin`)
- The documentation (at `$PREFIX/share/doc/joshi`)
- The JavaScript API libraries (at `$PREFIX/lib`)
- The include files needed to build native modules (at `$PREFIX/include`)
- The `joshpec` code generator used to build native module stubs (at 
  `$PREFIX/lib/joshpec`)

### Diverting joshi's library folder

There are times when you need to run a locally built `joshi` and make it load 
the JavaScript library from a development location (for example to diagnose a
bug, or to develop a new feature). 

For those cases, you can export an environment variable with the name
`JOSHI_LIB_DIR` pointing to the root folder of the JavaScript library
(for example: the [src/library](./src/library) folder of the project).

In absence of the `JOSHI_LIB_DIR` environment variable `joshi` looks for the
library based on the location of the `joshi` executable. If `joshi` is run from
`/usr/bin/joshi`, it will load the library at `/usr/lib/joshi`, if it is run
from `/usr/local/bin/joshi`, it will look for the library at
`/usr/local/lib/joshi` and so on...

### Makefile targets

Currently, the
[Makefile](./Makefile) understands the following targets:

1. `compile`: builds binaries (`joshi` and needed `.so` files)
2. `test`: run the project's automated tests
3. `docs`: builds the docs
4. `ci`: compiles and tests (invoked from GitHub workflows)
5. `clean`: removed any build artifact (wipes the project's `build` folder)
6. `install`: installs the package
7. `release`: runs the release process (tweaks version numbers, commits and tags
   source in Git).

### Used tools

As explained above, the project uses `gcc` to compile the C files. 

The project also needs to download [docdash](https://github.com/clenemt/docdash)
to create the docs and [Duktape](https://github.com/svaarala/duktape) for the
JavaScript engine.

These two downloads are completely automated using `curl`.

## Support

In a nutshell: there's no support ¯\\\_(ツ)\_/¯

I develop this project for my own needs and in my spare time, so don't expect me
to fix any of your issues under any SLA.

If you find a bug, feel free to use the
[Issues tab](https://github.com/izaera/joshi/issues) of the project so that I
can hint you on how to fix it (or maybe even fix it if I have the time 😀).

If you fix the bug, feel free to send a pull request so that I can merge.

If you need a new feature and want to send a pull request for it, file an issue 
first to see if it fits in the product. Beware that I want to keep the tool
simple and very opinionated on what it is supposed to do and how to do it, being
**simplicity and lack of dependencies** the main mantra, so don't get too fancy
😅.

In any case, `joshi` provides support for invoking any shared library (`.so` 
files) so there's nothing you can't do even if the core of the product doesn't 
allow it.

## Documentation

The project uses [JSDoc](https://jsdoc.app/) to generate its documentation. 

> 📚 Browse the documentation at the
> [project's site](https://izaera.github.io/joshi)

The API is divided in packages, like `fs`, `io`, `proc`, etc. 

> The whole list of packages is in the [src/library](./src/library) folder of
> the project.

The scope of each package should -hopefully- be clear given its name, and the 
functions inside it too. 

Because all packages resemble `POSIX` APIs, they don't declare classes, only 
functions and, sometimes, data structures based on JavaScript objects.

There are exceptions though: 

1. The [wui](./src/library/wui) package is dedicated to widget-oriented text
   user interfaces, so it declares widget classes. This is because object
   orientation is a quite convenient programming model for user interfaces.
2. The [shell](./src/library/shell) and [perf](./src/library/perf) packages
   return some objects that implement specific interfaces. That is, even if the
   API is purely function-based, some of the return values of those functions
   are object oriented.

## Examples

There are some examples available: you can have a look at [examples](./examples)
directory, the [tests](./tests), and the [repl](./src/library/repl.js) module to
see how the APIs can be used.

If you implement anything using `joshi` that is worth making public, please file
an issue so that I can add it here.

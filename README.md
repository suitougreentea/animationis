**NOTE: Some extra installation steps required!**

# animationis

**animātiō, ōnis, f.**

* The act of animating or giving life to, animation.
* A living being, form of life.

animationis: A scripting APNG generator.

## Installation

### 1. Install module

normally:

```
yarn add animationis
```

alternatively:

```
npm install animationis
```

### 2. Install canvas backend

**Install `canvas@next`.**

`canvas-prebuilt` is deprecated because `canvas` now installs prebuilt binaries if it can.

### 3. Install converter backend

**Install at least one of these binaries: `ffmpeg`, `apngasm`**

It means you will have to place the binary in your `$PATH`.

`apng2gif` also required if you are installing `apngasm` and using GIF output.

### 4. (Optional) Install transpiler register

If you are writing input scripts in the language which requires transpilation, install register module of each language.

animationis uses `rechoir` and `interpret` to detect and transform sources.
[See README of js-interpret](https://github.com/js-cli/js-interpret) for supported languages.

## Usage

```
yarn animationis
```

will display help screen:

```
  Usage: animationis [options] <path>


  Options:

    -o, --out-dir <outdir>     specify output directory
    -f, --format <format>      specify output format (default: png)
    -k, --keep-intermediate    do not remove intermediate files
    -c, --canvas <backend>     force to set canvas backend (available: canvas, canvas-prebuilt)
    -n, --converter <backend>  force to set converter backend (available: ffmpeg, apngasm)
    -v, --verbose              display verbose output
    -h, --help                 output usage information
```

Example:

```
yarn animationis source.js
```

## Input file syntax

Input file are written in pure JavaScript.
Optionally you can use TypeScript, Babel, CoffeeScript, and other languages.
See [4. (Optional) Install transpiler register](#4-optional-install-transpiler-register)

You must export *stage* or array of *stage*s.
*stage* is an object which includes:

|name|type|how it is used|
|---|---|---|
|(Optional) `name`|string|If specified, output file name will be `<input file name>-<specified name>.png`. If not, `<input file name>-<stage number>.png` or just `<input file name>.png`|
|`fps`|number|Frames per second|
|`component`|[component](#component) object|A component to be rendered|
|(Optional) `init`|function|Called once in the beginning|
|`run`|**generator** function|Each `yield` generates one frame|

## Component

Component class is defined in `src/component.js`. These method must be overridden:

* `getSize()` returns `[width, height]`
* `render(ctx: CanvasRenderingContext2D)` called every frame

A component which can contain other components is normally called *container*.

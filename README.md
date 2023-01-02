**NOTE: Some extra installation steps required!**

# animationis

**animātiō, ōnis, f.**

* The act of animating or giving life to, animation.
* A living being, form of life.

animationis: A scripting APNG generator.

## Installation

### 1. Install module

```
npm install animationis
```

### 2. Install canvas backend

**Install `canvas`.** Currently this is the only supported canvas backend.

### 3. Install converter backend

**Install at least one of these binaries: `ffmpeg`, `apngasm`**

It means you will have to place the binary in your `$PATH`.

`apng2gif` also required if you are installing `apngasm` and using GIF output.

### 4. (Optional) Install TypeScript loader

If you are using TypeScript as an input file, install `ts-node`.
**Since 0.10.0 animationis only supports an input file as a Native ES module, so set `NODE_OPTIONS="--loader ts-node/esm"` before running animationis.**
Also tsconfig.json needs to be configured. Minimum working settings:
```json
{
  "compilerOptions": {
    "target": "ES6",
    "module": "Node16",
  }
}
```

## Usage

```
npx animationis
```

will display help screen:

```
  Usage: animationis [options] <path>


  Options:

    -o, --out-dir <outdir>     specify output directory
    -f, --format <format>      specify output format (default: png)
    -k, --keep-intermediate    do not remove intermediate files
    -c, --canvas <backend>     force to set canvas backend (available: canvas)
    -n, --converter <backend>  force to set converter backend (available: ffmpeg, apngasm)
    -v, --verbose              display verbose output
    -h, --help                 output usage information
```

Example:

```bash
npx animationis source.js
```

```bash
# TypeScript
NODE_OPTIONS="--loader ts-node/esm" npx animationis source.ts
```

## Input file syntax

An input file is an single ES module. **Starting in 0.10.0, CommonJS or nonnative ESM is no longer supported.**

You must export (as `default`) a `Stage` or an array of `Stage`s.
`Stage` is an object which includes:

|name|type|how it is used|
|---|---|---|
|(Optional) `name`|string|If specified, output file name will be `<input file name>-<specified name>.png`. If not, `<input file name>-<stage number>.png` or just `<input file name>.png`|
|`fps`|number|Frames per second|
|`component`|[Component](#component)|A component to be rendered|
|(Optional) `init`|function|Called once in the beginning|
|`run`|**generator** function|Each `yield` generates one frame|

TypeScript user:
```ts
import { Stage } from "animationis"
```
```ts
export default <Stage>{ /* ... */ }
```
```ts
export default <Stage[]>[ /* ... */ ]
```

## Component

A `Component` is a renderer of a frame every time when `yield` is called.
You must define and use at least one `Component` to get an output.

```js
import { Component } from "animationis"
class FooComponent extends Component {
  // optional. called once before processing
  async init() { }
  // these 2 methods must be overridden
  getSize() { return [/* width */, /* height */] }
  render(ctx /* : CanvasRenderingContext2D */) {
    // issue render commands
  }
}
```

A component which can contain other components is normally called *container*.

## Example

### JavaScript input

`test/output/test-case-mjs.mjs`

```bash
npm run test-output-mjs
```

### TypeScript input

`test/output/test-case-ts.ts`

```bash
npm run test-output-ts
```

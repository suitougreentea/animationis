import Log from "loglevel"
import Fs from "fs"
import Path from "path"
import Util from "util"

import "source-map-support/register"
import { extensions as InterpretConfig } from "interpret"
import Rechoir from "rechoir"

import { getCanvasBackend, getDefaultCanvasBackend } from "./canvas-backend"
import { getConverterBackend, getDefaultConverterBackend } from "./converter-backend"
import { supplement, PropagationError } from "./util"

export default {
  // In the script you can use this to pass options to the components
  env: {},
  // Options passed by CLI
  options: null,
  // Canvas backend
  canvas: null,
  // Converter backend
  converter: null,

  inputPath: null,
  resolvedInputPath: null,
  parsedInputPath: null,
  baseName: null,
  outputDir: null,
  input: null,

  run: async function(path, _options) {
    try {
      await this.init(path, _options)
    } catch (e) {
      console.error("Initialization failed:")
      console.error(e)
      this.inputPath = null
      return
    }
    try {
      await this.loadInputFile()
    } catch (e) {
      console.error("Failed to load input file:")
      console.error(e)
      this.inputPath = null
      return
    }

    let error = false

    for (let index of this.input.keys()) {
      const stage = this.input[index]

      let stageName = ""
      if (this.input.length > 1) stageName = String(index + 1)
      if (stage.name) stageName = stage.name

      try {
        await this.processStage(stage, stageName)
      } catch (e) {
        console.error(`Failed to process stage ${stageName}:`)
        console.error(e)
        error = true
      }
    }

    if (error) Log.error("Done with error stages")
    else Log.info("All stages done!")
    this.inputPath = null
  },

  init: async function(path, options) {
    if (this.inputPath) throw new Error(`Another file ${this.inputPath} is in process`)

    this.env = null
    this.options = {
      outDir: supplement(options.outDir, null),
      format: supplement(options.format, "png"),
      canvasBackend: supplement(options.canvasBackend, null),
      converterBackend: supplement(options.converterBackend, null),
      keepIntermediate: supplement(options.keepIntermediate, false)
    }
    Log.debug("Initialize with options:")
    Log.debug(this.options)

    let canvasName = this.options.canvasBackend
    if (!canvasName) canvasName = await getDefaultCanvasBackend()
    if (!canvasName) throw new Error("No installed canvas backend detected. See README.")
    const canvas = getCanvasBackend(canvasName)
    if (!canvas) throw new Error(`Unable to find specified canvas backend: ${canvasName}`)
    if (!await canvas.isAvailable()) throw new Error(`Canvas backend ${canvasName} is not installed. See README.`)
    this.canvas = canvas
    try {
      await this.canvas.init()
    } catch (e) { throw new PropagationError(`Failed to initialize canvas backend: ${canvasName}`, e) }
    Log.debug("Initialized canvas backend: " + canvasName)

    let converterName = this.options.converterBackend
    if (!converterName) converterName = await getDefaultConverterBackend()
    if (!converterName) throw new Error("No installed converter backend detected. See README.")
    const converter = getConverterBackend(converterName)
    if (!converter) throw new Error(`Unable to find specified converter backend: ${converterName}`)
    if (!await converter.isAvailable()) throw new Error(`Converter backend ${converterName} is not installed. See README.`)
    if (!await converter.isFormatAvailable(this.options.format)) throw new Error(`Converter backend ${this.options.converter} does not support format ${this.options.format}`)
    this.converter = converter
    try {
      await this.converter.init()
    } catch (e) { throw new PropagationError(`Failed to initialize converter backend: ${converterName}`, e) }
    Log.debug("Initialized converter backend: " + converterName)

    this.inputPath = path
  },

  loadInputFile() {
    Log.debug(`Resolving input file: ${this.inputPath}`)
    this.resolvedInputPath = Path.resolve(this.inputPath)
    this.parsedInputPath = Path.parse(this.inputPath)
    this.baseName = this.parsedInputPath.name.split(".")[0]
    Log.debug(`Path resolved: ${this.resolvedInputPath}`)

    this.outputDir = supplement(this.options.outDir, this.parsedInputPath.dir)

    Log.info(`Loading input file: ${this.inputPath}`)
    Rechoir.prepare(InterpretConfig, this.resolvedInputPath)
    let __input
    try {
      __input = require(this.resolvedInputPath)
    } catch (e) { throw new PropagationError("An error occurred while loading input file", e) }

    // To support both CommonJS and ES6 export
    const _input = supplement(__input.default, __input)
    // Input will be array of "stages"
    this.input = Array.isArray(_input) ? _input : [_input]
  },

  processStage: async function(stage, stageName) {
    if (stageName) Log.info(`[Processing stage ${stageName}]`)
    const stageBaseName = stageName ? `${this.baseName}-${stageName}` : this.baseName
    const stageBasePath = Path.join(this.outputDir, stageBaseName)

    try {
      if (stage.init) await stage.init()
    } catch (e) { throw new PropagationError("An error occurred while executing init()", e) }

    const fps = stage.fps
    const component = stage.component

    const generateIntermediatePath = frame => Path.join(stageBasePath + "-" + String(frame).padStart(5, "0") + ".png")

    const [width, height] = component.getSize()
    const canvas = this.canvas.createCanvas(width, height)
    const ctx = canvas.getContext("2d")

    let frames = 0
    Log.info("  Outputting intermediate files")
    const run = stage.run.next ? stage.run : stage.run()

    while (true) {
      let done
      try {
        const result = run.next()
        done = result.done
      } catch (e) { throw new PropagationError("An error occurred while executing run()", e) }

      ctx.clearRect(0, 0, width, height)
      try {
        component.render(ctx)
      } catch (e) { throw new PropagationError("An error occurred while rendering components", e) }

      if (done) break
      const outputPathIntermediate = generateIntermediatePath(frames)
      Log.debug(`    Outputting intermediate file: ${outputPathIntermediate}`)
      try {
        await this.canvas.saveImage(outputPathIntermediate, canvas)
      } catch (e) { throw new PropagationError(`An error occurred while writing ${outputPathIntermediate}`, e) }
      frames++
    }
    Log.info(`  ${frames} frames written`)

    const extension = this.converter.getExtension(this.options.format)
    Log.info("  Outputting file: " + stageBasePath + "." + extension)
    try {
      await this.converter.convert(stageBasePath, this.options.format, frames, fps)
    } catch (e) { throw new PropagationError("An error occurred while converting", e) }

    if (!this.options.keepIntermediate) {
      const unlink = Util.promisify(Fs.unlink)
      Log.info("  Removing intermediate files")
      for (let i = 0; i < frames; i++) {
        const outputPathIntermediate = generateIntermediatePath(i)
        Log.debug("    Removing intermediate file: " + outputPathIntermediate)
        try {
          await unlink(outputPathIntermediate)
        } catch (e) { throw new PropagationError(`An error occurred while removing ${outputPathIntermediate}`, e) }
      }
    }

    Log.info("  Done")
  },

  loadImage: async function(path) {
    return await this.canvas.loadImage(path)
  }
}

export { default as Component } from "./component"

export function* concurrentGenerator(generators) {
  const iterators = generators.map(e => e())
  while (true) {
    const results = iterators.map(e => e.next())
    if (results.every(e => e.done)) return
    yield
    //yield results.map(e => e.value)
  }
}

import Canvas from "canvas"
import Log from "loglevel"

import { extensions as InterpretConfig } from "interpret"
import Rechoir from "rechoir"

import Fs from "fs"
import Path from "path"
import Util from "util"
import ChildProcess from "child_process"

// TODO: error handling!
export default class Animationis {
  static async processFile(path, _options) {
    const supplement = (opt, def) => { if (opt == null) return def; else return opt }
    const options = {
      gif: supplement(_options.gif, false),
      keepIntermediate: supplement(_options.keepIntermediate, false)
    }
    Log.debug("With options:")
    Log.debug(options)

    Log.debug(`Resolving input file: ${path}`)
    const resolvedPath = Path.resolve(path)
    const parsedPath = Path.parse(path)
    const fileName = parsedPath.name.split(".")[0]
    Log.debug(`Path resolved: ${resolvedPath}`)

    Log.info(`Loading input file: ${path}`)
    Rechoir.prepare(InterpretConfig, resolvedPath)
    let __input
    try {
      __input = require(resolvedPath)
    } catch (e) {
      console.error(e)
    }
    
    const _input = __input.default ? __input.default : __input
    const input = Array.isArray(_input) ? _input : [_input]

    for (let index of input.keys()) {
      const stage = input[index]

      let postfix = ""
      if (input.length > 1) postfix = String(index)
      if (stage.name) postfix = stage.name
      if (postfix) Log.info(`[Processing stage ${postfix}]`)
      const baseName = postfix ? `${fileName}-${postfix}` : fileName

      if (stage.init) await stage.init()
      const fps = stage.fps
      const component = stage.component

      const generateIntermediatePath = frame => Path.join(parsedPath.dir, baseName + "-" + String(frame).padStart(5, "0") + ".png")

      const [width, height] = component.getSize()
      const canvas = Canvas.createCanvas(width, height)
      const ctx = canvas.getContext("2d")

      let frames = 0
      Log.info("  Outputting intermediate files")
      const run = stage.run()
      while (true) {
        try {
          const {_, done} = run.next()
          ctx.clearRect(0, 0, width, height)
          component.render(ctx)

          if (done) break
          const outputPathIntermediate = generateIntermediatePath(frames)
          Log.debug(`    Outputting intermediate file: ${outputPathIntermediate}`)
          await Animationis.writeCurrentCanvas(outputPathIntermediate, canvas)
          frames++
        } catch (e) {
          console.error(e)
        }
      }

      const inputPath = Path.join(parsedPath.dir, baseName + "-%05d.png")
      const outputPath = Path.join(parsedPath.dir, baseName + (options.gif ? ".gif" : ".png"))
      Log.info("  Outputting file: " + outputPath)
      const command = [
        "ffmpeg",
        "-y",
        `-r ${fps}`,
        `-i ${inputPath}`,
        "-start_number 0",
        `-vframes ${frames}`,
        (options.gif ? "-f gif" : "-f apng"),
        (options.gif ? "-loop 0" : "-plays 0"),
        outputPath
      ].join(" ")
      Log.debug("    Command: " + command)

      const exec = Util.promisify(ChildProcess.exec)
      const { stdout, stderr } = await exec(command)
      Log.debug("  ffmpeg finished successfully:")
      Log.debug(stderr)

      if (!options.keepIntermediate) {
        const unlink = Util.promisify(Fs.unlink)
        Log.info("  Removing intermediate files")
        for (let i = 0; i < frames; i++) {
          const outputPathIntermediate = generateIntermediatePath(i)
          Log.debug("    Removing intermediate file: " + outputPathIntermediate)
          await unlink(outputPathIntermediate)
        }
      }

      Log.info("  Done")
    }

    Log.info("All stages done!")
  }

  static async writeCurrentCanvas(path, canvas) {
    return new Promise((resolve, reject) => {
      const writeStream = Fs.createWriteStream(path)
      const pngStream = canvas.pngStream()

      pngStream.on("data", chunk => writeStream.write(chunk))
      pngStream.on("end", () => writeStream.end())
      writeStream.on("finish", () => resolve())
    })
  }

  static async loadImage(path) {
    return await Canvas.loadImage(path)
  }
}

export { default as Component } from "./component"

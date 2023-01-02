import { checkModuleAvailability } from "./util.js"
import { createRequire } from "module"
import Fs from "fs"

import type { Canvas, Image } from "canvas"
import type * as _canvasModule from "canvas"
type CanvasModule = typeof _canvasModule

export class CanvasBackend<TImage> {
  async isAvailable() { return false }
  async init() {}
  async loadImage(path: string): Promise<TImage> { throw new Error("Not implemented") }
  async saveImage(path: string, canvas: Canvas) {}
  createCanvas(width: number, height: number): Canvas { throw new Error("Not implemented") }
}

class CanvasBackendNodeCanvas extends CanvasBackend<Image> {
  public canvas!: CanvasModule

  constructor(public readonly moduleName: string) {
    super()
  }

  async isAvailable() {
    return checkModuleAvailability(this.moduleName)
  }

  async init() {
    const require = createRequire(import.meta.url)
    this.canvas = require(this.moduleName)
    const a = require("canvas")
  }

  async loadImage(path: string) { return this.canvas.loadImage(path) }

  async saveImage(path: string, canvas: Canvas) {
    return new Promise<void>((resolve, reject) => {
      const writeStream = Fs.createWriteStream(path)
      const pngStream = canvas.createPNGStream()

      pngStream.on("data", chunk => writeStream.write(chunk))
      pngStream.on("end", () => writeStream.end())
      writeStream.on("finish", () => resolve())
    })
  }

  createCanvas(width: number, height: number) { return this.canvas.createCanvas(width, height) }
}

export function getCanvasBackend(module: string) {
  switch (module) {
    case "canvas":
      return new CanvasBackendNodeCanvas(module)
  }
  return null
}

export const canvasBackendList = ["canvas"]

export async function getDefaultCanvasBackend() {
  for (let module of canvasBackendList) {
    const backend = getCanvasBackend(module)
    if (backend != null && await backend.isAvailable()) {
      return module
    }
  }
  return null
}

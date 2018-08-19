import { checkModuleAvailability } from "./util"
import Fs from "fs"

class CanvasBackend {
  async isAvailable() { return false }
  async init() {}
  async loadImage(path) { return null }
  async saveImage(path, canvas) {}
  createCanvas(width, height) {}
}

class CanvasBackendNodeCanvas extends CanvasBackend {
  constructor(moduleName) {
    super()
    this.moduleName = moduleName
    this.canvas = null
  }

  async isAvailable() {
    return checkModuleAvailability(this.moduleName)
  }

  async init() {
    this.canvas = require(this.moduleName)
    if (this.moduleName == "canvas-prebuilt") console.warn("A support of canvas-prebuilt is deprecated. Use canvas instead.")
  }

  async loadImage(path) { return this.canvas.loadImage(path) }

  async saveImage(path, canvas) {
    return new Promise((resolve, reject) => {
      const writeStream = Fs.createWriteStream(path)
      const pngStream = canvas.pngStream()

      pngStream.on("data", chunk => writeStream.write(chunk))
      pngStream.on("end", () => writeStream.end())
      writeStream.on("finish", () => resolve())
    })
  }

  createCanvas(width, height) { return this.canvas.createCanvas(width, height) }
}

export function getCanvasBackend(module) {
  switch (module) {
    case "canvas":
    case "canvas-prebuilt":
      return new CanvasBackendNodeCanvas(module)
  }
  return null
}

export const canvasBackendList = ["canvas", "canvas-prebuilt"]

export async function getDefaultCanvasBackend() {
  for (let module of canvasBackendList) {
    const backend = getCanvasBackend(module)
    if (await backend.isAvailable()) {
      return module
    }
  }
  return null
}

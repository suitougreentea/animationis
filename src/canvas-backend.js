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
  constructor(module) {
    super()
    this.module = module
    this.canvas = null
  }

  async isAvailable() {
    if (checkModuleAvailability(this.module)) return true
  }

  async init() {
    this.canvas = require(this.module)
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

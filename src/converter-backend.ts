import ChildProcess from "child_process"
import Util from "util"
import Log from "loglevel"
import commandExists from "command-exists"

export class ConverterBackend {
  async isAvailable() { return false }
  async isFormatAvailable(format: string) { return false }
  getExtension(format: string) { return format }
  async init() {}
  async convert(basePath: string, format: string, frames: number, fps: number) {}
}

class ConverterBackendFFMpeg extends ConverterBackend {
  async isAvailable() {
    return await commandExists("ffmpeg").then(() => true).catch(() => false)
  }

  async isFormatAvailable(format: string) {
    return (
      format === "png" ||
      format === "gif"
    )
  }

  async init() {}

  async convert(basePath: string, format: string, frames: number, fps: number) {
    const inputPath = basePath + "-%05d.png"
    const outputPath = basePath + "." + this.getExtension(format)
    const command = [
      "ffmpeg",
      "-y",
      `-r ${fps}`,
      `-i ${inputPath}`,
      "-start_number 0",
      `-vframes ${frames}`,
      (format === "gif" ? "-f gif" : "-f apng"),
      (format === "gif" ? "-loop 0" : "-plays 0"),
      outputPath
    ].join(" ")
    Log.debug("    Command: " + command)

    const exec = Util.promisify(ChildProcess.exec)
    const {stdout, stderr} = await exec(command)
    Log.debug("  ffmpeg finished successfully:")
    Log.debug(stderr)
  }
}

class ConverterBackendAssembler extends ConverterBackend {
  async isAvailable() {
    return await commandExists("apngasm").then(() => true).catch(() => false)
  }

  async isFormatAvailable(format: string) {
    if (format === "png") return true
    if (format === "gif") return await commandExists("apng2gif").then(() => true).catch(() => false)
    return false
  }

  async init() {}

  async convert(basePath: string, format: string, frames: number, fps: number) {
    const inputPath = basePath + "-00000.png"
    const outputPath = basePath + ".png"
    const command = [
      "apngasm",
      outputPath,
      inputPath,
      `1 ${fps}`
    ].join(" ")
    Log.debug("    Command: " + command)

    const exec = Util.promisify(ChildProcess.exec)
    const {stdout, stderr} = await exec(command)
    Log.debug("  apngasm finished successfully:")
    Log.debug(stdout)

    if (format === "gif") {
      const command = [
        "apng2gif",
        outputPath,
      ].join(" ")
      Log.debug("    Command: " + command)

      const exec = Util.promisify(ChildProcess.exec)
      const {stdout, stderr} = await exec(command)
      Log.debug("  apng2gif finished successfully:")
      Log.debug(stdout)
    }
  }
}

export function getConverterBackend(module: string) {
  switch (module) {
    case "ffmpeg":
      return new ConverterBackendFFMpeg()
    case "apngasm":
      return new ConverterBackendAssembler()
  }
  return null
}

export const converterBackendList = ["ffmpeg", "apngasm"]

export async function getDefaultConverterBackend() {
  for (let module of converterBackendList) {
    const backend = getConverterBackend(module)
    if (backend != null && await backend.isAvailable()) {
      return module
    }
  }
  return null
}

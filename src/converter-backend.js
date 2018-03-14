import ChildProcess from "child_process"
import Util from "util"
import Log from "loglevel"
import commandExists from "command-exists"

class ConverterBackend {
  async isAvailable() { return false }
  async isFormatAvailable(format) { return false }
  getExtension(format) { return format }
  async init() {}
  async convert(basePath, format, frames, fps) {}
}

class ConverterBackendFFMpeg extends ConverterBackend {
  async isAvailable() {
    return await commandExists("ffmpeg").then(() => true).catch(() => false)
  }

  isFormatAvailable(format) {
    return (
      format === "png" ||
      format === "gif"
    )
  }

  async init() {}

  async convert(basePath, format, frames, fps) {
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

  async isFormatAvailable(format) {
    if (format === "png") return true
    if (format === "gif") return await commandExists("apng2gif").then(() => true).catch(() => false)
  }

  async init() {}

  async convert(basePath, format, frames, fps) {
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

export function getConverterBackend(module) {
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
    if (await backend.isAvailable()) {
      return module
    }
  }
  return null
}

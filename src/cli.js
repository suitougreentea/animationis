import Animationis from "./index"
import commander from "commander"

import { canvasBackendList } from "./canvas-backend"
import { converterBackendList } from "./converter-backend"

import Log from "loglevel"
Log.setDefaultLevel(2)

let path

commander
  .arguments("<path>")
  .option("-o, --out-dir <outdir>", "specify output directory")
  .option("-f, --format <format>", "specify output format (default: png)")
  .option("-k, --keep-intermediate", "do not remove intermediate files")
  .option("-c, --canvas <backend>", `force to set canvas backend (available: ${canvasBackendList.join(", ")})`)
  .option("-n, --converter <backend>", `force to set converter backend (available: ${converterBackendList.join(", ")})`)
  .option("-v, --verbose", "display verbose output")
  .action(_path => {
    path = _path
  })
  .parse(process.argv)

if (!path) {
  commander.outputHelp()
  process.exit(1)
}

if (commander.verbose) Log.setDefaultLevel(1)

Animationis.run(path, {
  outDir: commander.outDir,
  format: commander.format,
  canvasBackend: commander.canvas,
  converterBackend: commander.converter,
  keepIntermediate: commander.keepIntermediate,
})

import Animationis from "./index.js"
import { Command } from "@commander-js/extra-typings"

import { canvasBackendList } from "./canvas-backend.js"
import { converterBackendList } from "./converter-backend.js"

import Log from "loglevel"
Log.setDefaultLevel(2)

let path

const program = new Command()
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
  .exitOverride((err) => {
    if (err.code === "commander.missingArgument") {
      program.outputHelp()
    }
    process.exit(err.exitCode);
  })

program.parse(process.argv)

if (!path) {
  program.outputHelp()
  process.exit(1)
}

const options = program.opts()

if (options.verbose) Log.setDefaultLevel(1)

Animationis.run(path, {
  outDir: options.outDir,
  format: options.format,
  canvasBackend: options.canvas,
  converterBackend: options.converter,
  keepIntermediate: options.keepIntermediate,
})

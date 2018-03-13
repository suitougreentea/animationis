import Animationis from "./index"
import commander from "commander"

import Log from "loglevel"
Log.setDefaultLevel(2)

let path

commander
  .arguments("<path>")
  .option("-o, --out-dir <outdir>", "specify output directory")
  .option("-g, --gif", "output gif instead of apng")
  .option("-k, --keep-intermediate", "do not remove intermediate files")
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

Animationis.processFile(path, {
  outDir: commander.outDir,
  gif: commander.gif,
  keepIntermediate: commander.keepIntermediate
})

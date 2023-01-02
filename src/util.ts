import { createRequire } from "module"

export function checkModuleAvailability(name: string) {
  try {
    const require = createRequire(import.meta.url)
    require.resolve(name)
    return true
  } catch (e) {
    return false
  }
}

export function supplement<T>(val: T | null | undefined, def: T) {
  if (val == null) return def
  return val
}

export class PropagationError extends Error {
  constructor(message: string, public readonly e: unknown) {
    super(message)
  }
}

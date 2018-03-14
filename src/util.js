export function checkModuleAvailability(name) {
  try {
    require.resolve(name)
    return true
  } catch (e) {
    return false
  }
}

export function supplement(val, def) {
  if (val == null) return def
  return val
}

export class PropagationError extends Error {
  constructor(message, e) {
    super(message)
    this.e = e
  }
}

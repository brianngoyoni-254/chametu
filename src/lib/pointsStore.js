const VERSION = 2
const KEY = 'chametu_pts_v2'
const LEGACY_KEY = 'chametu_pts_v1'

export function initial() {
  return {
    schema: VERSION,
    lots: [],
    ledger: [],
    last: null,
    keys: {},
    red: {},
    refs: [],
    phones: [],
    devs: [],
    rid: 0,
  }
}

export function load() {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY))
    if (raw && raw.schema === VERSION) return raw
    const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY))
    return migrate(legacy)
  } catch {
    return null
  }
}

export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...state, schema: VERSION }))
  } catch {}
}

function migrate(raw) {
  if (!raw) return null
  return { ...initial(), ...raw, schema: VERSION }
}

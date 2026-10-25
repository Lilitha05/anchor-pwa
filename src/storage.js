// Everything Anchor saves lives in localStorage on this phone only.

const PIN_KEY = 'calc.v'
const PROFILE_KEY = 'calc.p'
const ALERT_KEY = 'calc.a'
const LOCK_KEY = 'calc.l'
const LOG_KEY = 'calc.e'

// ---------- Hashing (so the PIN is never saved as plain text) ----------

const encoder = new TextEncoder()

// turns bytes into a hex string like "0fa3..."
function toHex(buffer) {
  const bytes = new Uint8Array(buffer)
  let text = ''
  for (let i = 0; i < bytes.length; i++) {
    text = text + bytes[i].toString(16).padStart(2, '0')
  }
  return text
}

// turns a hex string back into bytes
function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2)
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16)
  }
  return bytes
}

// PBKDF2 hash of the code and a random salt
async function derive(code, salt) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(code), 'PBKDF2', false, ['deriveBits'])
  return crypto.subtle.deriveBits({ name: 'PBKDF2', salt: salt, iterations: 150000, hash: 'SHA-256' }, key, 256)
}

// hashes a code with a new salt and saves it under the given key
async function saveHash(storageKey, code) {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const hash = await derive(code, salt)
  localStorage.setItem(storageKey, JSON.stringify({ s: toHex(salt), h: toHex(hash) }))
}

// checks a typed code against the saved hash
async function matchesHash(storageKey, code) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey))
    const hash = await derive(code, fromHex(saved.s))
    return toHex(hash) === saved.h
  } catch (error) {
    return false
  }
}

// ---------- PIN ----------

export function hasPin() {
  return localStorage.getItem(PIN_KEY) !== null
}

export async function setPin(pin) {
  await saveHash(PIN_KEY, pin)
}

export async function checkPin(pin) {
  return await matchesHash(PIN_KEY, pin)
}

// ---------- Alert code (a second code that starts an alert) ----------

export function hasAlertCode() {
  return localStorage.getItem(ALERT_KEY) !== null
}

export async function setAlertCode(code) {
  if (!code) {
    localStorage.removeItem(ALERT_KEY)
    return
  }
  await saveHash(ALERT_KEY, code)
}

export async function checkAlertCode(code) {
  return await matchesHash(ALERT_KEY, code)
}

// ---------- Setup data (Safe Circle, messages, preferences) ----------

export const emptyProfile = {
  done: false,
  circle: [],
  note: 'Please reply with our agreed note. Do not call.',
  alertMsg: 'I need help now. Please contact me safely or get help to me.',
  timerMsg: 'Please check in with me. I may need support.',
  trends: false,
}

export function getProfile() {
  try {
    const saved = JSON.parse(localStorage.getItem(PROFILE_KEY))
    return Object.assign({}, emptyProfile, saved)
  } catch (error) {
    return Object.assign({}, emptyProfile)
  }
}

export function saveProfile(profile) {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile))
}

// ---------- Lockout (5 wrong codes = locked for 30 seconds, even after a refresh) ----------

function readLock() {
  try {
    const saved = JSON.parse(localStorage.getItem(LOCK_KEY))
    if (saved) {
      return saved
    }
  } catch (error) {
    // ignore, use the default below
  }
  return { f: 0, u: 0 } // f = failed tries, u = locked until (time in ms)
}

export function lockedUntil() {
  return readLock().u
}

export function clearFails() {
  localStorage.removeItem(LOCK_KEY)
}

export function registerFail() {
  const lock = readLock()
  const fails = lock.f + 1
  if (fails >= 5) {
    localStorage.setItem(LOCK_KEY, JSON.stringify({ f: 0, u: Date.now() + 30000 }))
  } else {
    localStorage.setItem(LOCK_KEY, JSON.stringify({ f: fails, u: lock.u }))
  }
}

// ---------- Event log (time and type only, never the message text) ----------

export function getLog() {
  try {
    const saved = JSON.parse(localStorage.getItem(LOG_KEY))
    if (saved) {
      return saved
    }
  } catch (error) {
    // ignore, use the default below
  }
  return []
}

export function clearLog() {
  localStorage.removeItem(LOG_KEY)
}

export function logEvent(type) {
  try {
    const log = getLog()
    log.push({ t: Date.now(), type: type })
    const last200 = log.slice(-200) // keep the log small
    localStorage.setItem(LOG_KEY, JSON.stringify(last200))
  } catch (error) {
    // if saving fails we just skip the log
  }
}

// ---------- Delete everything ----------

export function wipeAll() {
  localStorage.clear()
  sessionStorage.clear()
  try {
    caches.keys().then(function (names) {
      names.forEach(function (name) {
        caches.delete(name)
      })
    })
  } catch (error) {
    // caches not available, nothing to clear
  }
}

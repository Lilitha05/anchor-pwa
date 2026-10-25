import { getProfile, logEvent } from './storage.js'
import { getPosition } from './geo.js'
import { buildBody, postMessages, clean } from './messages.js'

// The "Stay With Me" timer is saved in localStorage so a refresh does not lose it.
// status: 'active' -> 'sent' (server confirmed) or 'due' (nothing sent yet)
const TIMER_KEY = 'calc.t'

export function getTimer() {
  try {
    return JSON.parse(localStorage.getItem(TIMER_KEY))
  } catch (error) {
    return null
  }
}

export function setTimer(record) {
  localStorage.setItem(TIMER_KEY, JSON.stringify(record))
}

export function clearTimer() {
  localStorage.removeItem(TIMER_KEY)
}

let firing = false // stops the check from running twice at the same time

// Called every second by App.jsx while the page is open.
// When the time is up it tries to send through the alert server.
export async function checkTimer() {
  const record = getTimer()
  if (!record || record.status !== 'active' || firing) {
    return
  }
  if (Date.now() < record.dueAt) {
    return
  }

  firing = true
  logEvent('missed')
  let status = 'due'

  try {
    const profile = getProfile()
    const serverSet = import.meta.env.VITE_ALERT_URL
    if (serverSet && profile.circle.length > 0) {
      let wantsLocation = false
      for (let i = 0; i < profile.circle.length; i++) {
        if (profile.circle[i].loc) {
          wantsLocation = true
        }
      }
      let pos = null
      if (wantsLocation) {
        pos = await getPosition(8000)
      }
      const messages = []
      for (let i = 0; i < profile.circle.length; i++) {
        const c = profile.circle[i]
        messages.push({ to: clean(c.phone), body: buildBody(c, profile.timerMsg, pos) })
      }
      const ok = await postMessages(messages)
      if (ok) {
        status = 'sent'
      }
    }
  } finally {
    setTimer(Object.assign({}, record, { status: status }))
    firing = false
  }
}

import { getPosition } from './geo.js'

// Helper functions for building and sending the messages.

// Takes the spaces out of a phone number
export function clean(number) {
  return number.replace(/\s/g, '')
}

// Builds the text for one contact.
// The map link is only added if that contact is allowed to get my location.
export function buildBody(contact, base, pos) {
  let text = base
  if (contact.loc) {
    if (pos) {
      text = text + ' My location: https://maps.google.com/?q=' + pos.lat.toFixed(5) + ',' + pos.lng.toFixed(5)
    } else {
      text = text + ' (I could not get my location.)'
    }
  }
  return text
}

// Sends the messages to the alert server (the Twilio function, built later).
// Returns true ONLY if the server accepted them, otherwise false.
export async function postMessages(messages) {
  const url = import.meta.env.VITE_ALERT_URL
  if (!url) {
    return false
  }
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages }),
    })
    return response.ok
  } catch (error) {
    return false
  }
}

// Used by the Red state. Gets the location, makes a message for each contact and sends it.
// Returns 'sent', 'failed' or 'nocircle' so the app can show the right notification.
export async function sendQuietly(contacts, base) {
  if (contacts.length === 0) {
    return 'nocircle'
  }

  // only ask for location if at least one contact should get it
  let pos = null
  let wantsLocation = false
  for (let i = 0; i < contacts.length; i++) {
    if (contacts[i].loc) {
      wantsLocation = true
    }
  }
  if (wantsLocation) {
    pos = await getPosition(5000)
  }

  const messages = []
  for (let i = 0; i < contacts.length; i++) {
    messages.push({ to: clean(contacts[i].phone), body: buildBody(contacts[i], base, pos) })
  }

  const ok = await postMessages(messages)
  if (ok) {
    return 'sent'
  }
  return 'failed'
}

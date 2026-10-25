import { useEffect, useRef, useState } from 'react'
import { getPosition } from './geo.js'
import { logEvent } from './storage.js'
import { buildBody, postMessages, clean } from './messages.js'
import { Icon } from './icons.jsx'

// This screen sends an alert, a quiet check-in (Amber) or a finished Stay With Me timer.
//
// Phases:  counting -> working -> sent  (the alert server confirmed it)
//                              -> ready (no server, so the person sends the texts by hand)
//
// A web page cannot send a text by itself. Without an alert server (VITE_ALERT_URL)
// Anchor only prepares the texts. "Sent" is shown ONLY if the server says yes.
export default function SendScreen({ contacts, profile, kind, countdown = 0, onDone }) {
  const [left, setLeft] = useState(countdown) // seconds left in the countdown
  const [phase, setPhase] = useState(countdown > 0 ? 'counting' : 'working')
  const [pos, setPos] = useState(null)
  const [tapped, setTapped] = useState([]) // ids of the contacts whose text was opened
  const positionPromise = useRef(null)

  // does anyone in the list get my location?
  let wantsLocation = false
  for (let i = 0; i < contacts.length; i++) {
    if (contacts[i].loc) {
      wantsLocation = true
    }
  }

  // pick the message text for this kind of send
  let base = profile.note
  if (kind === 'alert') {
    base = profile.alertMsg
  } else if (kind === 'timer') {
    base = profile.timerMsg
  }

  // start looking for the location straight away so it is ready after the countdown
  useEffect(function () {
    if (wantsLocation && contacts.length > 0) {
      positionPromise.current = getPosition(8000)
    }
  }, [])

  // the countdown
  useEffect(function () {
    if (phase !== 'counting') {
      return
    }
    if (left <= 0) {
      setPhase('working')
      return
    }
    const timeout = setTimeout(function () {
      setLeft(left - 1)
    }, 1000)
    return function () {
      clearTimeout(timeout)
    }
  }, [phase, left])

  // send the messages
  useEffect(function () {
    if (phase !== 'working' || contacts.length === 0) {
      return
    }
    let stillHere = true

    async function sendNow() {
      let position = null
      if (positionPromise.current) {
        position = await positionPromise.current
      } else if (wantsLocation) {
        position = await getPosition(8000)
      }
      if (!stillHere) {
        return
      }
      setPos(position)

      if (kind !== 'timer') {
        logEvent(kind) // a finished timer is already logged as 'missed'
      }

      const messages = []
      for (let i = 0; i < contacts.length; i++) {
        messages.push({ to: clean(contacts[i].phone), body: buildBody(contacts[i], base, position) })
      }
      const ok = await postMessages(messages)
      if (stillHere) {
        if (ok) {
          setPhase('sent')
        } else {
          setPhase('ready')
        }
      }
    }

    sendNow()
    return function () {
      stillHere = false
    }
  }, [phase])

  // short text for who it is going to
  let who = contacts.length + ' people'
  if (contacts.length === 1) {
    who = contacts[0].name
  }

  // ---------- Nobody in the circle ----------
  if (contacts.length === 0) {
    return (
      <section className="success-content">
        <div className="eyebrow">Safe Circle</div>
        <h1>No one in your circle yet.</h1>
        <p className="lead">Add a trusted person in the Circle tab so a message has somewhere to go.</p>
        <button className="primary-button full" onClick={onDone}>Return to calculator</button>
      </section>
    )
  }

  // ---------- Countdown (a chance to cancel) ----------
  if (phase === 'counting') {
    let heading = 'Check-in'
    if (kind === 'alert') {
      heading = 'Alert'
    }
    return (
      <section className="success-content">
        <div className="eyebrow">{heading}</div>
        <div className="timer-clock" aria-live="assertive">{left}</div>
        <p className="lead">Sending to {who}. Cancel if this was a mistake.</p>
        <button className="primary-button full" onClick={function () { setLeft(0) }}>Send now</button>
        <button className="secondary-button full" style={{ marginTop: 10 }} onClick={onDone}>Cancel</button>
      </section>
    )
  }

  // ---------- Getting the location ----------
  if (phase === 'working') {
    let workingTitle = 'Getting ready…'
    if (wantsLocation) {
      workingTitle = 'Getting your location…'
    }
    return (
      <section className="success-content">
        <div className="eyebrow">One moment</div>
        <h1>{workingTitle}</h1>
        <p className="lead">This can take a few seconds.</p>
      </section>
    )
  }

  // text about the location, used in two screens below
  let locationText = ''
  if (wantsLocation) {
    if (pos) {
      locationText = 'Your location was included for the contacts you chose.'
    } else {
      locationText = 'Your location could not be found, and the message says so.'
    }
  }

  // ---------- The server confirmed it ----------
  if (phase === 'sent') {
    return (
      <section className="success-content">
        <div className="success-icon"><Icon name="check" size={30} /></div>
        <div className="eyebrow">Confirmed by the alert server</div>
        <h1>Your message was sent.</h1>
        <p className="lead">{locationText}</p>
        <button className="primary-button full" onClick={onDone}>Return to calculator</button>
      </section>
    )
  }

  // ---------- No server: the person sends the texts by hand ----------
  let eyebrow = 'Ready to send'
  if (kind === 'timer') {
    eyebrow = 'Your check-in timer ended'
  }

  return (
    <section className="page-content">
      <div className="eyebrow">{eyebrow}</div>
      <h1>Your message is ready.</h1>
      <p className="lead">
        Nothing has been sent yet. This phone cannot send it silently, so tap each name and press send
        in your messages app. The text will stay in your message history.
      </p>
      {wantsLocation && <p className="muted-note">{locationText}</p>}
      <div className="call-list">
        {contacts.map(function (c) {
          const wasTapped = tapped.includes(c.id)
          const link = 'sms:' + clean(c.phone) + '?&body=' + encodeURIComponent(buildBody(c, base, pos))
          return (
            <a key={c.id} className="call-card" href={link} onClick={function () { setTapped(tapped.concat([c.id])) }}>
              <span className="call-icon"><Icon name={wasTapped ? 'check' : 'send'} /></span>
              <span>
                <strong>Text {c.name}</strong>
                <small>{wasTapped ? 'Opened. Press send in your messages.' : c.role}</small>
              </span>
              <Icon name="chevron" />
            </a>
          )
        })}
      </div>
      <button className="primary-button full" style={{ marginTop: 18 }} onClick={onDone}>Return to calculator</button>
    </section>
  )
}

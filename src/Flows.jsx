import { useEffect, useState } from 'react'
import { helplines } from './data.js'
import { Icon } from './icons.jsx'
import { getTimer } from './timer.js'
import { clean } from './messages.js'
import SendScreen from './Alert.jsx'

// turns a number of seconds into mm:ss, for example 905 -> "15:05"
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return String(minutes).padStart(2, '0') + ':' + String(rest).padStart(2, '0')
}

// ---------- Home screen (Green / Amber / Red) ----------
export function Home({ go, pick }) {
  const [record, setRecord] = useState(getTimer)
  const [now, setNow] = useState(Date.now())

  // refresh every second so the Stay With Me card shows the time left
  useEffect(function () {
    const interval = setInterval(function () {
      setRecord(getTimer())
      setNow(Date.now())
    }, 1000)
    return function () {
      clearInterval(interval)
    }
  }, [])

  // text for the Stay With Me card: [small title, big line, small line]
  let card = ['Feeling uneasy?', 'Start a safety check-in', 'Set a timer and ask your Safe Circle to watch out for you.']
  if (record && record.status === 'active') {
    const secondsLeft = Math.max(0, Math.ceil((record.dueAt - now) / 1000))
    card = ['Check-in active', formatTime(secondsLeft) + ' remaining', 'The timer only runs while Anchor stays open in your browser.']
  } else if (record && record.status === 'sent') {
    card = ['Safe Circle notified', 'The alert server confirmed it', 'Open to review.']
  } else if (record && record.status === 'due') {
    card = ['Check-in ended', 'Nothing has been sent yet', 'Open to send your message now.']
  }

  // [screen, label, title, detail, icon]
  const choices = [
    ['green', 'Green', 'I can speak', 'See people and services you can call.', 'mic'],
    ['amber', 'Amber', 'I can type quietly', 'Prepare a discreet check-in to someone you trust.', 'message'],
    ['red', 'Red', 'My phone may be watched', 'Quietly tells your Safe Circle, then Anchor closes straight away.', 'eyeOff'],
  ]

  return (
    <section className="home-content">
      <div className="home-kicker"><span className="pulse-dot" />You're in control</div>
      <h1>What can you safely do right now?</h1>
      <p className="lead compact">Choose the option that feels safest. You can leave at any time.</p>

      <button className="safety-timer-card" onClick={function () { go('timer') }}>
        <span className="timer-card-icon"><Icon name="clock" size={23} /></span>
        <span className="timer-card-copy">
          <span>{card[0]}</span>
          <strong>{card[1]}</strong>
          <small>{card[2]}</small>
        </span>
        <Icon name="chevron" />
      </button>

      <div className="state-list">
        {choices.map(function (choice) {
          const screen = choice[0]
          return (
            <button key={screen} className={'state-card ' + screen} onClick={function () { pick(screen) }}>
              <span className="state-indicator"><Icon name={choice[4]} size={22} /></span>
              <span className="state-copy">
                <span className="state-label">{choice[1]}</span>
                <strong>{choice[2]}</strong>
                <small>{choice[3]}</small>
              </span>
              <Icon name="chevron" />
            </button>
          )
        })}
      </div>

      <button className="alert-card" onClick={function () { go('alert') }}>
        <span className="alert-icon"><Icon name="send" size={22} /></span>
        <span>
          <strong>Send an alert now</strong>
          <small>Message and location to your Safe Circle, with 5 seconds to cancel.</small>
        </span>
        <Icon name="chevron" />
      </button>

      <div className="privacy-line"><Icon name="lock" size={16} />Your choices stay on this device.</div>
    </section>
  )
}

// ---------- Green: people and helplines to call ----------
export function Green({ circle }) {
  // only the people whose role is "Call me"
  const callers = circle.filter(function (c) {
    return c.role === 'Call me'
  })

  return (
    <section className="page-content">
      <div className="state-heading green">
        <span className="large-state-dot" />
        <div><span>Green</span><h1>Who would you like to call?</h1></div>
      </div>
      <p className="lead compact">Tapping a number opens your phone's dialler. You decide whether to call.</p>
      <div className="call-list">
        {callers.map(function (c) {
          return (
            <a key={c.id} className="call-card" href={'tel:' + clean(c.phone)}>
              <span className="call-icon"><Icon name="call" /></span>
              <span><strong>{c.name}</strong><small>Safe Circle · Call me</small></span>
              <Icon name="chevron" />
            </a>
          )
        })}
        {helplines.map(function (h) {
          return (
            <a key={h.id} className="call-card" href={'tel:' + h.number}>
              <span className="call-icon"><Icon name="call" /></span>
              <span><strong>{h.label}</strong><small>{h.number}</small></span>
              <Icon name="chevron" />
            </a>
          )
        })}
      </div>
      {callers.length === 0 && (
        <p className="muted-note">Add someone with the role "Call me" in the Circle tab to see them here.</p>
      )}
      <p className="verification-note">Check these numbers against official sources before relying on them.</p>
    </section>
  )
}

// ---------- Amber: review, then send a quiet check-in ----------
export function Amber({ profile, onDone, back }) {
  const [sending, setSending] = useState(false)

  // the person to send to: the first "Quiet check-in" contact, or the first contact in the circle
  let contact = null
  for (let i = 0; i < profile.circle.length; i++) {
    if (profile.circle[i].role === 'Quiet check-in' && contact === null) {
      contact = profile.circle[i]
    }
  }
  if (contact === null && profile.circle.length > 0) {
    contact = profile.circle[0]
  }

  // once the person presses the button (or nobody is in the circle) go to the send screen
  if (sending || contact === null) {
    let list = []
    if (contact !== null) {
      list = [contact]
    }
    return <SendScreen contacts={list} profile={profile} kind="checkin" onDone={onDone} />
  }

  let locationText = 'Not included'
  if (contact.loc) {
    locationText = 'Included'
  }

  // the text depends on whether an alert server has been connected (see TWILIO-SETUP.md)
  let howSending = "Your phone can't send this silently. Anchor prepares the text and you press send."
  if (import.meta.env.VITE_ALERT_URL) {
    howSending = 'Anchor sends this for you through the alert server. It only says "sent" if the server confirms.'
  }

  return (
    <section className="page-content">
      <div className="state-heading amber">
        <span className="large-state-dot" />
        <div><span>Amber</span><h1>Review before you send.</h1></div>
      </div>
      <div className="summary-card">
        <div className="summary-row"><span>To</span><strong>{contact.name} · {contact.role}</strong></div>
        <div className="divider" />
        <div className="summary-row message"><span>Message</span><strong>"{profile.note}"</strong></div>
        <div className="divider" />
        <div className="summary-row"><span>Location</span><strong>{locationText}</strong></div>
      </div>
      <div className="notice subtle">
        <Icon name="shield" />
        <div>
          <strong>How sending works</strong>
          <p>{howSending}</p>
        </div>
      </div>
      <button className="primary-button full send-button" onClick={function () { setSending(true) }}>
        <Icon name="send" />Prepare my check-in
      </button>
      <button className="text-button centered" onClick={back}>Not now</button>
    </section>
  )
}

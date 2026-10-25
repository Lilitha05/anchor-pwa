import { useEffect, useState } from 'react'
import { Icon } from './icons.jsx'
import { getTimer, setTimer, clearTimer } from './timer.js'
import { getPosition } from './geo.js'
import SendScreen from './Alert.jsx'

// turns a number of seconds into mm:ss
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return String(minutes).padStart(2, '0') + ':' + String(rest).padStart(2, '0')
}

// "Stay With Me": a check-in timer.
// If it ends before the person taps "I'm safe", Anchor tries to alert the Safe Circle.
// Honest limit: it only runs while the page stays open.
export default function Timer({ profile, back, exit, go }) {
  const [record, setRecord] = useState(getTimer)
  const [now, setNow] = useState(Date.now())
  const [minutes, setMinutes] = useState(15)
  const circle = profile.circle

  // refresh every second
  useEffect(function () {
    const interval = setInterval(function () {
      setRecord(getTimer())
      setNow(Date.now())
    }, 1000)
    return function () {
      clearInterval(interval)
    }
  }, [])

  // text for who will be told
  let who = circle.length + ' people'
  if (circle.length === 1) {
    who = circle[0].name
  }

  // ---------- Time ran out and nothing was sent yet ----------
  if (record && record.status === 'due') {
    function finishDue() {
      clearTimer()
      exit()
    }
    return <SendScreen contacts={circle} profile={profile} kind="timer" onDone={finishDue} />
  }

  // ---------- Time ran out and the server confirmed the message ----------
  if (record && record.status === 'sent') {
    function finishSent() {
      clearTimer()
      exit()
    }
    return (
      <section className="timer-result">
        <div className="success-icon"><Icon name="check" size={29} /></div>
        <div className="eyebrow">Confirmed by the alert server</div>
        <h1>Your Safe Circle was notified.</h1>
        <p className="lead">Your check-in ended and the alert server confirmed it sent your message.</p>
        <button className="primary-button full" onClick={finishSent}>Return to calculator</button>
      </section>
    )
  }

  // ---------- Timer is running ----------
  if (record && record.status === 'active') {
    const secondsLeft = Math.max(0, Math.ceil((record.dueAt - now) / 1000))

    function imSafe() {
      clearTimer()
      back()
    }
    function alertNow() {
      clearTimer()
      go('alert')
    }
    function endTimerNow() {
      setTimer(Object.assign({}, record, { dueAt: Date.now() }))
    }

    return (
      <section className="active-timer-content">
        <div className="active-timer-label"><span />Safety check-in active</div>
        <p className="timer-caption">Check in before the timer ends</p>
        <div className="timer-clock" aria-live="off">{formatTime(secondsLeft)}</div>
        <p className="timer-contact">
          {who} will be told if you don't check in.
          <br />Keep Anchor open in your browser. It can't count down once the browser is closed.
        </p>
        <button className="safe-button" onClick={imSafe}><Icon name="check" />I'm safe</button>
        <button className="alert-now-button" onClick={alertNow}>Send alert now</button>
        <button className="demo-expire-button" onClick={endTimerNow}>Demo: end the timer now</button>
      </section>
    )
  }

  // ---------- Setting up a new timer ----------
  function startTimer() {
    setTimer({ dueAt: Date.now() + minutes * 60000, status: 'active' })
    setRecord(getTimer())

    // ask for location permission now, not later
    let wantsLocation = false
    for (let i = 0; i < circle.length; i++) {
      if (circle[i].loc) {
        wantsLocation = true
      }
    }
    if (wantsLocation) {
      getPosition(8000)
    }
  }

  // first letter for the little circle, and the line saying who is told
  let initial = '?'
  let whoText = 'No one yet'
  if (circle.length > 0) {
    initial = circle[0].name[0].toUpperCase()
    whoText = who
    if (circle.length > 1) {
      whoText = circle.length + ' people in your Safe Circle'
    }
  }

  const options = [15, 30, 60]

  return (
    <section className="page-content">
      <div className="timer-hero-icon"><Icon name="clock" size={25} /></div>
      <div className="eyebrow">Plan ahead</div>
      <h1>Let someone stay with you.</h1>
      <p className="lead compact">Start a private timer when a journey, meeting or situation feels uncertain.</p>

      <div className="timer-section">
        <label className="field-label">Check in after</label>
        <div className="duration-options">
          {options.map(function (d) {
            let className = 'duration'
            if (minutes === d) {
              className = 'duration active'
            }
            return (
              <button key={d} className={className} onClick={function () { setMinutes(d) }}>
                <strong>{d}</strong><span>min</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="timer-plan-card">
        <div className="timer-plan-row">
          <span className="avatar">{initial}</span>
          <span><small>Who is told</small><strong>{whoText}</strong></span>
          <span className="status-pill">Safe Circle</span>
        </div>
        <div className="divider" />
        <div className="timer-message"><small>Message</small><p>"{profile.timerMsg}"</p></div>
      </div>

      <button className="primary-button full" disabled={circle.length === 0} onClick={startTimer}>
        <Icon name="clock" />Start {minutes}-minute check-in
      </button>
      {circle.length === 0 && <p className="field-error">Add someone to your Safe Circle first.</p>}
      <p className="timer-honesty">
        This timer only runs while Anchor stays open. If it ends without a check-in, Anchor sends through
        the alert server if one is set up. Otherwise it prepares the message and waits for you to send it,
        because a web page cannot send for you.
      </p>
    </section>
  )
}

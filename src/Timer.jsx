import { useEffect, useState } from 'react'
import { Icon } from './icons.jsx'
import { getTimer, setTimer, clearTimer } from './timer.js'
import { getPosition } from './geo.js'
import SendScreen from './Alert.jsx'
import { t } from './lang.js'

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
  let who = t('people', { n: circle.length })
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
        <div className="eyebrow">{t('confirmed')}</div>
        <h1>{t('tNotified')}</h1>
        <p className="lead">{t('tNotifiedLead')}</p>
        <button className="primary-button full" onClick={finishSent}>{t('returnCalc')}</button>
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
        <div className="active-timer-label"><span />{t('tActive')}</div>
        <p className="timer-caption">{t('tBefore')}</p>
        <div className="timer-clock" aria-live="off">{formatTime(secondsLeft)}</div>
        <p className="timer-contact">
          {t('tWillTell', { who: who })}
          <br />{t('tKeepOpen')}
        </p>
        <button className="safe-button" onClick={imSafe}><Icon name="check" />{t('tSafe')}</button>
        <button className="alert-now-button" onClick={alertNow}>{t('tAlertNow')}</button>
        <button className="demo-expire-button" onClick={endTimerNow}>{t('tDemo')}</button>
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
  let whoText = t('tNoOne')
  if (circle.length > 0) {
    initial = circle[0].name[0].toUpperCase()
    whoText = who
    if (circle.length > 1) {
      whoText = t('tPeopleCircle', { n: circle.length })
    }
  }

  const options = [15, 30, 60]

  return (
    <section className="page-content">
      <div className="timer-hero-icon"><Icon name="clock" size={25} /></div>
      <div className="eyebrow">{t('tPlan')}</div>
      <h1>{t('tH1')}</h1>
      <p className="lead compact">{t('tLead')}</p>

      <div className="timer-section">
        <label className="field-label">{t('tAfter')}</label>
        <div className="duration-options">
          {options.map(function (d) {
            let className = 'duration'
            if (minutes === d) {
              className = 'duration active'
            }
            return (
              <button key={d} className={className} onClick={function () { setMinutes(d) }}>
                <strong>{d}</strong><span>{t('tMin')}</span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="timer-plan-card">
        <div className="timer-plan-row">
          <span className="avatar">{initial}</span>
          <span><small>{t('tWho')}</small><strong>{whoText}</strong></span>
          <span className="status-pill">{t('safeCircle')}</span>
        </div>
        <div className="divider" />
        <div className="timer-message"><small>{t('aMessage')}</small><p>"{profile.timerMsg}"</p></div>
      </div>

      <button className="primary-button full" disabled={circle.length === 0} onClick={startTimer}>
        <Icon name="clock" />{t('tStart', { m: minutes })}
      </button>
      {circle.length === 0 && <p className="field-error">{t('tAddFirst')}</p>}
      <p className="timer-honesty">{t('tHonest')}</p>
    </section>
  )
}

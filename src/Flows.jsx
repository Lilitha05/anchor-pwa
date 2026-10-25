import { useEffect, useState } from 'react'
import { helplines } from './data.js'
import { Icon } from './icons.jsx'
import { getTimer } from './timer.js'
import { clean } from './messages.js'
import SendScreen from './Alert.jsx'
import { t } from './lang.js'
import { roleName } from './Onboarding.jsx'

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
  let card = [t('cardIdle1'), t('cardIdle2'), t('cardIdle3')]
  if (record && record.status === 'active') {
    const secondsLeft = Math.max(0, Math.ceil((record.dueAt - now) / 1000))
    card = [t('cardActive1'), t('cardActive2', { time: formatTime(secondsLeft) }), t('cardActive3')]
  } else if (record && record.status === 'sent') {
    card = [t('cardSent1'), t('cardSent2'), t('cardSent3')]
  } else if (record && record.status === 'due') {
    card = [t('cardDue1'), t('cardDue2'), t('cardDue3')]
  }

  // [screen, label, title, detail, icon]
  const choices = [
    ['green', t('green'), t('titleGreen'), t('greenDetail'), 'mic'],
    ['amber', t('amber'), t('amberChoice'), t('amberDetail'), 'message'],
    ['red', t('red'), t('redChoice'), t('redDetail'), 'eyeOff'],
  ]

  return (
    <section className="home-content">
      <div className="home-kicker"><span className="pulse-dot" />{t('inControl')}</div>
      <h1>{t('homeTitle')}</h1>
      <p className="lead compact">{t('homeLead')}</p>

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
          <strong>{t('alertCardTitle')}</strong>
          <small>{t('alertCardDetail')}</small>
        </span>
        <Icon name="chevron" />
      </button>

      <div className="privacy-line"><Icon name="lock" size={16} />{t('privacy')}</div>
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
        <div><span>{t('green')}</span><h1>{t('gHeading')}</h1></div>
      </div>
      <p className="lead compact">{t('gLead')}</p>
      <div className="call-list">
        {callers.map(function (c) {
          return (
            <a key={c.id} className="call-card" href={'tel:' + clean(c.phone)}>
              <span className="call-icon"><Icon name="call" /></span>
              <span><strong>{c.name}</strong><small>{t('safeCircle')} · {t('role_call')}</small></span>
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
        <p className="muted-note">{t('gAdd')}</p>
      )}
      <p className="verification-note">{t('gNote')}</p>
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

  let locationText = t('aNotIncluded')
  if (contact.loc) {
    locationText = t('aIncluded')
  }

  // the text depends on whether an alert server has been connected (see TWILIO-SETUP.md)
  let howSending = t('aHowManual')
  if (import.meta.env.VITE_ALERT_URL) {
    howSending = t('aHowServer')
  }

  return (
    <section className="page-content">
      <div className="state-heading amber">
        <span className="large-state-dot" />
        <div><span>{t('amber')}</span><h1>{t('aHeading')}</h1></div>
      </div>
      <div className="summary-card">
        <div className="summary-row"><span>{t('aTo')}</span><strong>{contact.name} · {roleName(contact.role)}</strong></div>
        <div className="divider" />
        <div className="summary-row message"><span>{t('aMessage')}</span><strong>"{profile.note}"</strong></div>
        <div className="divider" />
        <div className="summary-row"><span>{t('aLocation')}</span><strong>{locationText}</strong></div>
      </div>
      <div className="notice subtle">
        <Icon name="shield" />
        <div>
          <strong>{t('aHow')}</strong>
          <p>{howSending}</p>
        </div>
      </div>
      <button className="primary-button full send-button" onClick={function () { setSending(true) }}>
        <Icon name="send" />{t('aPrepare')}
      </button>
      <button className="text-button centered" onClick={back}>{t('aNotNow')}</button>
    </section>
  )
}

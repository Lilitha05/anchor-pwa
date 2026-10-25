import { useState } from 'react'
import { isCode } from './Onboarding.jsx'
import { Icon } from './icons.jsx'
import { Toggle } from './ui.jsx'
import { checkPin, setPin, setAlertCode, hasAlertCode, wipeAll } from './storage.js'

// removes everything that is not a digit
function onlyDigits(text) {
  return text.replace(/\D/g, '')
}

export default function Settings({ profile, onChange, onExit, go }) {
  const [message, setMessage] = useState('')
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [newPin2, setNewPin2] = useState('')
  const [code, setCode] = useState('')
  const [sure, setSure] = useState(false) // true after "Delete everything" is pressed once

  // changes one field of the profile (for example note, alertMsg or timerMsg)
  function changeField(field, value) {
    const updated = Object.assign({}, profile)
    updated[field] = value
    onChange(updated)
  }

  async function changePin() {
    const correct = await checkPin(currentPin)
    if (!correct) {
      setMessage('Your current PIN is not right.')
      return
    }
    if (!isCode(newPin)) {
      setMessage('Use 4 to 8 digits.')
      return
    }
    if (newPin !== newPin2) {
      setMessage('The new PINs do not match.')
      return
    }
    await setPin(newPin)
    setCurrentPin('')
    setNewPin('')
    setNewPin2('')
    setMessage('PIN changed.')
  }

  async function changeCode() {
    if (code === '') {
      await setAlertCode('')
      setMessage('Alert code removed.')
      return
    }
    if (!isCode(code)) {
      setMessage('Use 4 to 8 digits for the alert code.')
      return
    }
    const sameAsPin = await checkPin(code)
    if (sameAsPin) {
      setMessage('The alert code must be different from your PIN.')
      return
    }
    await setAlertCode(code)
    setCode('')
    setMessage('Alert code saved.')
  }

  function deleteEverything() {
    wipeAll()
    onExit()
  }

  let alertCodeStatus = '(not set)'
  if (hasAlertCode()) {
    alertCodeStatus = '(set)'
  }

  return (
    <section className="page-content">
      <div className="eyebrow">Your choices</div>
      <h1>Privacy and settings</h1>
      {message && (
        <div className="notice subtle" aria-live="polite" style={{ marginTop: 0 }}>
          <Icon name="shield" />
          <div><strong>{message}</strong></div>
        </div>
      )}

      <div className="settings-list">
        <button onClick={function () { go('insights') }}><span>Insights</span><Icon name="chevron" /></button>
      </div>

      <div className="inline-form">
        <label className="field-label" htmlFor="s-note">Check-in note (Amber and Red)</label>
        <textarea className="text-field" id="s-note" rows={2} maxLength="140" value={profile.note}
          onChange={function (e) { changeField('note', e.target.value) }} />
        <label className="field-label" htmlFor="s-alert">Alert message</label>
        <textarea className="text-field" id="s-alert" rows={2} maxLength="140" value={profile.alertMsg}
          onChange={function (e) { changeField('alertMsg', e.target.value) }} />
        <label className="field-label" htmlFor="s-timer">Check-in timer message</label>
        <textarea className="text-field" id="s-timer" rows={2} maxLength="140" value={profile.timerMsg}
          onChange={function (e) { changeField('timerMsg', e.target.value) }} />
      </div>

      <div className="settings-group">
        <Toggle title="Anonymous support trends" detail="Coarse area and category only. Nothing is sent in this prototype yet."
          checked={profile.trends} onChange={function (value) { changeField('trends', value) }} />
      </div>

      <div className="inline-form">
        <strong>Change PIN</strong>
        <label className="field-label" htmlFor="p-cur">Current PIN</label>
        <input className="text-field" id="p-cur" type="password" inputMode="numeric" maxLength="8" value={currentPin}
          onChange={function (e) { setCurrentPin(onlyDigits(e.target.value)) }} />
        <label className="field-label" htmlFor="p-1">New PIN</label>
        <input className="text-field" id="p-1" type="password" inputMode="numeric" maxLength="8" value={newPin}
          onChange={function (e) { setNewPin(onlyDigits(e.target.value)) }} />
        <label className="field-label" htmlFor="p-2">New PIN again</label>
        <input className="text-field" id="p-2" type="password" inputMode="numeric" maxLength="8" value={newPin2}
          onChange={function (e) { setNewPin2(onlyDigits(e.target.value)) }} />
        <button className="secondary-button full" onClick={changePin}>Change PIN</button>
      </div>

      <div className="inline-form" style={{ marginTop: 14 }}>
        <strong>Alert code {alertCodeStatus}</strong>
        <label className="field-label" htmlFor="a-code">New alert code (leave empty to remove)</label>
        <input className="text-field" id="a-code" type="password" inputMode="numeric" maxLength="8" value={code}
          onChange={function (e) { setCode(onlyDigits(e.target.value)) }} />
        <button className="secondary-button full" onClick={changeCode}>Save alert code</button>
      </div>

      <div className="honest-note">
        <Icon name="shield" />
        <p>Anchor cannot guarantee complete privacy on shared phones, in browser or message history, or from someone who knows your PIN.</p>
      </div>

      {!sure && (
        <button className="danger-button" onClick={function () { setSure(true) }}>Delete everything and start again</button>
      )}
      {sure && (
        <div className="inline-form">
          <strong>Delete everything?</strong>
          <p className="muted-note" style={{ margin: 0 }}>
            This removes your PIN, Safe Circle, settings, timer and history from this phone. It cannot be undone.
          </p>
          <button className="danger-button" onClick={deleteEverything}>Yes, delete everything</button>
          <button className="text-button centered" onClick={function () { setSure(false) }}>No, keep my data</button>
        </div>
      )}
    </section>
  )
}

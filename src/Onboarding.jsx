import { useState } from 'react'
import { getPosition } from './geo.js'
import { clean } from './messages.js'
import { Icon } from './icons.jsx'
import { Toggle } from './ui.jsx'

export const ROLES = ['Quiet check-in', 'Call me', 'Transport', 'Professional support']
const MAX = 10 // the most people allowed in a Safe Circle

// a PIN or alert code must be 4 to 8 digits
export function isCode(text) {
  return /^\d{4,8}$/.test(text)
}

// the text we offer to send to a new contact, so they know what the messages mean
export function inviteText(note) {
  return 'I\'ve added you to my Safe Circle on a safety app. If I send you "' + note +
    '" or "I need help now", please check on me or get help to me. Please don\'t call unless I ask.'
}

// ---------- Add, edit and remove Safe Circle contacts ----------
// Used in the first-time setup and in the Circle tab.
export function CircleEditor({ circle, note, onChange }) {
  const blank = { name: '', phone: '', role: ROLES[0], loc: true }
  const [form, setForm] = useState(blank)
  const [editId, setEditId] = useState(null) // id of the contact being edited, or null
  const [adding, setAdding] = useState(circle.length === 0)

  const full = circle.length >= MAX && editId === null

  // is this phone number already in the circle?
  const digits = form.phone.replace(/\D/g, '')
  let duplicate = false
  for (let i = 0; i < circle.length; i++) {
    const otherDigits = circle[i].phone.replace(/\D/g, '')
    if (circle[i].id !== editId && otherDigits === digits) {
      duplicate = true
    }
  }

  // the form can be saved when it has a name, a number and no duplicate
  const canSave = form.name.trim() !== '' && digits.length >= 9 && !duplicate

  // changes one field of the form
  function changeForm(field, value) {
    const updated = Object.assign({}, form)
    updated[field] = value
    setForm(updated)
  }

  function changeLocation(value) {
    changeForm('loc', value)
    if (value) {
      getPosition(6000) // the phone asks for permission here, inside Anchor
    }
  }

  function save() {
    if (!canSave) {
      return
    }
    let id = Date.now()
    if (editId !== null) {
      id = editId
    }
    const person = { id: id, name: form.name.trim(), phone: form.phone.trim(), role: form.role, loc: form.loc }

    if (editId !== null) {
      // replace the old version of this person
      const newCircle = circle.map(function (c) {
        if (c.id === editId) {
          return person
        }
        return c
      })
      onChange(newCircle)
    } else {
      onChange(circle.concat([person]))
    }
    setForm(blank)
    setEditId(null)
    setAdding(false)
  }

  function startEdit(c) {
    setEditId(c.id)
    setAdding(true)
    setForm({ name: c.name, phone: c.phone, role: c.role, loc: !!c.loc })
  }

  function remove(id) {
    const newCircle = circle.filter(function (c) {
      return c.id !== id
    })
    onChange(newCircle)
  }

  function cancel() {
    setEditId(null)
    setAdding(false)
    setForm(blank)
  }

  let limitText = 'You can add up to ' + MAX + '.'
  if (full) {
    limitText = 'Your circle is full.'
  }

  let saveLabel = 'Save person'
  if (editId !== null) {
    saveLabel = 'Save changes'
  }

  return (
    <>
      <div className="circle-list">
        {circle.map(function (c) {
          let locationText = 'not shared'
          if (c.loc) {
            locationText = 'shared'
          }
          return (
            <div className="circle-card" key={c.id}>
              <div className="avatar">{c.name[0].toUpperCase()}</div>
              <div>
                <strong>{c.name}</strong>
                <small>{c.role}</small>
                <span>{c.phone} · Location {locationText}</span>
                {note && (
                  <a className="invite" href={'sms:' + clean(c.phone) + '?&body=' + encodeURIComponent(inviteText(note))}>
                    Send invite text
                  </a>
                )}
              </div>
              <div className="stack">
                <button className="mini-button" onClick={function () { startEdit(c) }}>Edit</button>
                <button className="mini-button" aria-label={'Remove ' + c.name} onClick={function () { remove(c.id) }}>Remove</button>
              </div>
            </div>
          )
        })}
      </div>
      {note && circle.length > 0 && (
        <p className="muted-note">An invite text explains what your messages mean. It will appear in your message history.</p>
      )}

      {adding && (
        <div className="inline-form">
          <label className="field-label" htmlFor="c-name">Name or nickname</label>
          <input className="text-field" id="c-name" value={form.name} autoComplete="off" maxLength="30"
            onChange={function (e) { changeForm('name', e.target.value) }} />
          <label className="field-label" htmlFor="c-phone">Phone number</label>
          <input className="text-field" id="c-phone" value={form.phone} inputMode="tel" autoComplete="off" maxLength="20"
            onChange={function (e) { changeForm('phone', e.target.value) }} />
          {duplicate && <p className="field-error">This number is already in your circle.</p>}
          <label className="field-label" htmlFor="c-role">How can they help?</label>
          <select className="text-field" id="c-role" value={form.role}
            onChange={function (e) { changeForm('role', e.target.value) }}>
            {ROLES.map(function (r) {
              return <option key={r}>{r}</option>
            })}
          </select>
          <Toggle title="Share my location with them" detail="Included only when you send an alert or check-in."
            checked={form.loc} onChange={changeLocation} />
          <button className="primary-button full" disabled={!canSave} onClick={save}>{saveLabel}</button>
          {(editId !== null || circle.length > 0) && (
            <button className="text-button centered" onClick={cancel}>Cancel</button>
          )}
        </div>
      )}
      {!adding && !full && (
        <button className="secondary-button full add-button" onClick={function () { setAdding(true) }}>
          <span>+</span> Add someone
        </button>
      )}
      <p className="muted-note">{circle.length} of {MAX} added. {limitText}</p>
    </>
  )
}

// small label showing how many people are in the circle, for example "3 of 10"
export function CountPill({ n }) {
  return <span className="count-pill">{n} of {MAX}</span>
}

// ---------- First-time setup (a few steps) ----------
export default function Onboarding({ initial, pendingPin, onDone, exit }) {
  // the list of steps. The "pin" step only appears when a new PIN was just typed.
  const steps = []
  if (pendingPin) {
    steps.push('pin')
  }
  steps.push('welcome', 'circle', 'note', 'panic', 'choices')

  const [i, setI] = useState(0) // the current step number
  const [p, setP] = useState(initial) // the profile being filled in
  const [pin2, setPin2] = useState('')
  const [code, setCode] = useState('')
  const [geoText, setGeoText] = useState('')

  const step = steps[i]
  const isLast = i === steps.length - 1

  // changes one field of the profile
  function setField(field, value) {
    const updated = Object.assign({}, p)
    updated[field] = value
    setP(updated)
  }

  // can the person press Continue on this step?
  function canContinue() {
    if (step === 'pin') {
      return pin2 === pendingPin
    }
    if (step === 'note') {
      return p.note.trim().length > 0
    }
    if (step === 'panic') {
      if (p.alertMsg.trim().length === 0) {
        return false
      }
      if (code === '') {
        return true // the alert code is optional
      }
      return isCode(code) && code !== pendingPin
    }
    return true
  }

  // text on the main button
  let buttonLabel = 'Continue'
  if (step === 'welcome') {
    buttonLabel = 'I understand'
  } else if (step === 'circle' && p.circle.length === 0) {
    buttonLabel = 'Skip for now'
  } else if (isLast) {
    buttonLabel = 'Finish setup'
  }

  function next() {
    if (isLast) {
      onDone(Object.assign({}, p, { done: true }), { pin: pendingPin, code: code })
    } else {
      setI(i + 1)
    }
  }

  async function allowLocation() {
    const position = await getPosition(8000)
    if (position) {
      setGeoText('Location works.')
    } else {
      setGeoText('Could not get a location. Check your phone settings and allow it for this site.')
    }
  }

  const progress = ((i + 1) / steps.length) * 100

  return (
    <main className="app-screen onboarding">
      <div className="setup-top">
        <div className="brand-mark"><Icon name="shield" size={23} /></div>
        <button className="exit-button" onClick={exit}>Exit</button>
      </div>
      <div className="step-row">
        <span aria-live="polite">Step {i + 1} of {steps.length}</span>
        <div className="step-track"><div className="step-fill" style={{ width: progress + '%' }} /></div>
      </div>

      <section className="setup-content">
        {step === 'pin' && (
          <>
            <div className="eyebrow">Confirm your PIN</div>
            <h1>Type it once more.</h1>
            <p className="lead">This stops a typo from locking you out. Anchor is only saved once the two match.</p>
            <label className="field-label" htmlFor="pin2">PIN</label>
            <input className="text-field" id="pin2" type="password" inputMode="numeric" maxLength="8" autoComplete="off" value={pin2}
              onChange={function (e) { setPin2(e.target.value.replace(/\D/g, '')) }} />
            {pin2.length >= pendingPin.length && pin2 !== pendingPin && (
              <p className="field-error">That does not match the PIN you typed on the calculator.</p>
            )}
            <p className="fine-print">If you forget your PIN, the only way back in is to clear this app's data and start again.</p>
          </>
        )}

        {step === 'welcome' && (
          <>
            <div className="eyebrow">Welcome to Anchor</div>
            <h1>A quiet way to reach people you trust.</h1>
            <p className="lead">Anchor adapts to what you can safely do in the moment. You stay in control of what is shared and when.</p>
            <div className="notice">
              <Icon name="lock" />
              <div>
                <strong>Your privacy comes first</strong>
                <p>No account and no tracking. Everything you set up stays on this phone.</p>
              </div>
            </div>
            <p className="fine-print">No app can promise to be completely undetectable, especially on a shared phone. If you think someone is checking your phone, choose Red.</p>
          </>
        )}

        {step === 'circle' && (
          <>
            <div className="eyebrow">Your Safe Circle</div>
            <h1>Choose people you trust.</h1>
            <p className="lead">Add 2 to 10 people, say how each can help, and choose who can see your location. You can skip this and add them later.</p>
            <CircleEditor circle={p.circle} onChange={function (c) { setField('circle', c) }} />
          </>
        )}

        {step === 'note' && (
          <>
            <div className="eyebrow">Your check-in</div>
            <h1>Agree on a simple note.</h1>
            <p className="lead">Choose ordinary words your trusted person will understand. Anchor sends it in Amber and Red.</p>
            <label className="field-label" htmlFor="note">Check-in note</label>
            <textarea className="text-field" id="note" rows={4} maxLength="140" value={p.note}
              onChange={function (e) { setField('note', e.target.value) }} />
            <p className="field-help">Tell your circle what this note means before you need it.</p>
          </>
        )}

        {step === 'panic' && (
          <>
            <div className="eyebrow">Your alert code</div>
            <h1>A second code for emergencies.</h1>
            <p className="lead">Type it on the calculator and press = to send an alert with your location. You get 5 seconds to cancel. It must differ from your PIN.</p>
            <label className="field-label" htmlFor="code">Alert code (4 to 8 digits, optional)</label>
            <input className="text-field" id="code" type="password" inputMode="numeric" maxLength="8" autoComplete="off" value={code}
              onChange={function (e) { setCode(e.target.value.replace(/\D/g, '')) }} />
            {code !== '' && !isCode(code) && <p className="field-error">Use 4 to 8 digits.</p>}
            {code !== '' && code === pendingPin && <p className="field-error">This must be different from your PIN.</p>}
            <label className="field-label" htmlFor="amsg" style={{ marginTop: 16 }}>Alert message</label>
            <textarea className="text-field" id="amsg" rows={3} maxLength="140" value={p.alertMsg}
              onChange={function (e) { setField('alertMsg', e.target.value) }} />
          </>
        )}

        {step === 'choices' && (
          <>
            <div className="eyebrow">Your choices</div>
            <h1>Only share what feels safe.</h1>
            <p className="lead">Location is read only when you send an alert or check-in, and only shared with people you chose.</p>
            <div className="notice subtle" style={{ marginTop: 0, marginBottom: 14 }}>
              <Icon name="shield" />
              <div>
                <strong>Allow location now</strong>
                <p>Your phone will ask once. If you say no, alerts still go, without a location.</p>
                <button className="mini-button" style={{ marginTop: 10 }} onClick={allowLocation}>Allow location</button>
                {geoText && <p aria-live="polite">{geoText}</p>}
              </div>
            </div>
            <Toggle title="Share anonymous support trends" detail="Coarse area and category only, never your message. Off unless you turn it on."
              checked={p.trends} onChange={function (value) { setField('trends', value) }} />
          </>
        )}
      </section>

      <div className="setup-actions">
        {i > 0 && <button className="text-button" onClick={function () { setI(i - 1) }}>Back</button>}
        <button className="primary-button" disabled={!canContinue()} onClick={next}>
          {buttonLabel}<Icon name={isLast ? 'check' : 'chevron'} />
        </button>
      </div>
    </main>
  )
}

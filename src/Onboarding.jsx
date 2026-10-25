import { useState } from 'react'
import { getPosition } from './geo.js'
import { clean } from './messages.js'
import { Icon } from './icons.jsx'
import { Toggle } from './ui.jsx'
import { t } from './lang.js'
import LanguageMenu from './LanguageMenu.jsx'

// The roles are saved in English, so the rest of the app can compare them.
// roleKeys turns a saved role into the key for its translated name.
export const ROLES = ['Quiet check-in', 'Call me', 'Transport', 'Professional support']
const roleKeys = {
  'Quiet check-in': 'role_quiet',
  'Call me': 'role_call',
  'Transport': 'role_transport',
  'Professional support': 'role_pro',
}
const MAX = 10 // the most people allowed in a Safe Circle

// the translated name of a role
export function roleName(role) {
  return t(roleKeys[role])
}

// a PIN or alert code must be 4 to 8 digits
export function isCode(text) {
  return /^\d{4,8}$/.test(text)
}

// the text we offer to send to a new contact, so they know what the messages mean
export function inviteText(note) {
  return t('inviteText', { note: note })
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

  let limitText = t('edUpTo', { max: MAX })
  if (full) {
    limitText = t('edFull')
  }

  let saveLabel = t('edSave')
  if (editId !== null) {
    saveLabel = t('edSaveChanges')
  }

  return (
    <>
      <div className="circle-list">
        {circle.map(function (c) {
          let locationText = t('edNotShared')
          if (c.loc) {
            locationText = t('edShared')
          }
          return (
            <div className="circle-card" key={c.id}>
              <div className="avatar">{c.name[0].toUpperCase()}</div>
              <div>
                <strong>{c.name}</strong>
                <small>{roleName(c.role)}</small>
                <span>{c.phone} · {t('edLocation', { x: locationText })}</span>
                {note && (
                  <a className="invite" href={'sms:' + clean(c.phone) + '?&body=' + encodeURIComponent(inviteText(note))}>
                    {t('edInvite')}
                  </a>
                )}
              </div>
              <div className="stack">
                <button className="mini-button" onClick={function () { startEdit(c) }}>{t('edEdit')}</button>
                <button className="mini-button" aria-label={t('edRemove') + ' ' + c.name} onClick={function () { remove(c.id) }}>{t('edRemove')}</button>
              </div>
            </div>
          )
        })}
      </div>
      {note && circle.length > 0 && (
        <p className="muted-note">{t('edInviteNote')}</p>
      )}

      {adding && (
        <div className="inline-form">
          <label className="field-label" htmlFor="c-name">{t('edName')}</label>
          <input className="text-field" id="c-name" value={form.name} autoComplete="off" maxLength="30"
            onChange={function (e) { changeForm('name', e.target.value) }} />
          <label className="field-label" htmlFor="c-phone">{t('edPhone')}</label>
          <input className="text-field" id="c-phone" value={form.phone} inputMode="tel" autoComplete="off" maxLength="20"
            onChange={function (e) { changeForm('phone', e.target.value) }} />
          {duplicate && <p className="field-error">{t('edDup')}</p>}
          <label className="field-label" htmlFor="c-role">{t('edRole')}</label>
          <select className="text-field" id="c-role" value={form.role}
            onChange={function (e) { changeForm('role', e.target.value) }}>
            {ROLES.map(function (r) {
              return <option key={r} value={r}>{roleName(r)}</option>
            })}
          </select>
          <Toggle title={t('edShare')} detail={t('edShareP')} checked={form.loc} onChange={changeLocation} />
          <button className="primary-button full" disabled={!canSave} onClick={save}>{saveLabel}</button>
          {(editId !== null || circle.length > 0) && (
            <button className="text-button centered" onClick={cancel}>{t('cancel')}</button>
          )}
        </div>
      )}
      {!adding && !full && (
        <button className="secondary-button full add-button" onClick={function () { setAdding(true) }}>
          <span>+</span> {t('edAdd')}
        </button>
      )}
      <p className="muted-note">{t('edCount', { n: circle.length, max: MAX, limit: limitText })}</p>
    </>
  )
}

// small label showing how many people are in the circle, for example "3 of 10"
export function CountPill({ n }) {
  return <span className="count-pill">{t('xOfY', { n: n, max: MAX })}</span>
}

// ---------- First-time setup (a few steps) ----------
// The first step is choosing the language, so everything after it is in that language.
export default function Onboarding({ initial, pendingPin, onDone, exit, lang, onLang }) {
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
  let buttonLabel = t('cont')
  if (step === 'welcome') {
    buttonLabel = t('understand')
  } else if (step === 'circle' && p.circle.length === 0) {
    buttonLabel = t('skip')
  } else if (isLast) {
    buttonLabel = t('finish')
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
      setGeoText(t('locOk'))
    } else {
      setGeoText(t('locFail'))
    }
  }

  const progress = ((i + 1) / steps.length) * 100

  return (
    <main className="app-screen onboarding">
      <div className="setup-top">
        <div className="brand-mark"><Icon name="shield" size={23} /></div>
        <div className="setup-top-right">
          <LanguageMenu lang={lang} onChange={onLang} />
          <button className="exit-button" onClick={exit}>{t('exit')}</button>
        </div>
      </div>
      <div className="step-row">
        <span aria-live="polite">{t('step', { i: i + 1, n: steps.length })}</span>
        <div className="step-track"><div className="step-fill" style={{ width: progress + '%' }} /></div>
      </div>

      <section className="setup-content">

        {step === 'pin' && (
          <>
            <div className="eyebrow">{t('pinTitle')}</div>
            <h1>{t('pinH1')}</h1>
            <p className="lead">{t('pinLead')}</p>
            <label className="field-label" htmlFor="pin2">PIN</label>
            <input className="text-field" id="pin2" type="password" inputMode="numeric" maxLength="8" autoComplete="off" value={pin2}
              onChange={function (e) { setPin2(e.target.value.replace(/\D/g, '')) }} />
            {pin2.length >= pendingPin.length && pin2 !== pendingPin && (
              <p className="field-error">{t('pinMismatch')}</p>
            )}
            <p className="fine-print">{t('pinFine')}</p>
          </>
        )}

        {step === 'welcome' && (
          <>
            <div className="eyebrow">{t('wEyebrow')}</div>
            <h1>{t('wH1')}</h1>
            <p className="lead">{t('wLead')}</p>
            <div className="notice">
              <Icon name="lock" />
              <div>
                <strong>{t('wNoticeT')}</strong>
                <p>{t('wNoticeP')}</p>
              </div>
            </div>
            <p className="fine-print">{t('wFine')}</p>
          </>
        )}

        {step === 'circle' && (
          <>
            <div className="eyebrow">{t('cEyebrow')}</div>
            <h1>{t('cH1')}</h1>
            <p className="lead">{t('cLead')}</p>
            <CircleEditor circle={p.circle} onChange={function (c) { setField('circle', c) }} />
          </>
        )}

        {step === 'note' && (
          <>
            <div className="eyebrow">{t('nEyebrow')}</div>
            <h1>{t('nH1')}</h1>
            <p className="lead">{t('nLead')}</p>
            <label className="field-label" htmlFor="note">{t('nLabel')}</label>
            <textarea className="text-field" id="note" rows={4} maxLength="140" value={p.note}
              onChange={function (e) { setField('note', e.target.value) }} />
            <p className="field-help">{t('nHelp')}</p>
          </>
        )}

        {step === 'panic' && (
          <>
            <div className="eyebrow">{t('aEyebrow')}</div>
            <h1>{t('aH1')}</h1>
            <p className="lead">{t('aLead')}</p>
            <label className="field-label" htmlFor="code">{t('aLabel')}</label>
            <input className="text-field" id="code" type="password" inputMode="numeric" maxLength="8" autoComplete="off" value={code}
              onChange={function (e) { setCode(e.target.value.replace(/\D/g, '')) }} />
            {code !== '' && !isCode(code) && <p className="field-error">{t('aDigits')}</p>}
            {code !== '' && code === pendingPin && <p className="field-error">{t('aDiffer')}</p>}
            <label className="field-label" htmlFor="amsg" style={{ marginTop: 16 }}>{t('aMsgLabel')}</label>
            <textarea className="text-field" id="amsg" rows={3} maxLength="140" value={p.alertMsg}
              onChange={function (e) { setField('alertMsg', e.target.value) }} />
          </>
        )}

        {step === 'choices' && (
          <>
            <div className="eyebrow">{t('chEyebrow')}</div>
            <h1>{t('chH1')}</h1>
            <p className="lead">{t('chLead')}</p>
            <div className="notice subtle" style={{ marginTop: 0, marginBottom: 14 }}>
              <Icon name="shield" />
              <div>
                <strong>{t('locNoticeT')}</strong>
                <p>{t('locNoticeP')}</p>
                <button className="mini-button" style={{ marginTop: 10 }} onClick={allowLocation}>{t('locBtn')}</button>
                {geoText && <p aria-live="polite">{geoText}</p>}
              </div>
            </div>
            <Toggle title={t('trendsT')} detail={t('trendsP')}
              checked={p.trends} onChange={function (value) { setField('trends', value) }} />
            <p className="muted-note">{t('trendsWhy')}</p>
          </>
        )}
      </section>

      <div className="setup-actions">
        {i > 0 && <button className="text-button" onClick={function () { setI(i - 1) }}>{t('backShort')}</button>}
        <button className="primary-button" disabled={!canContinue()} onClick={next}>
          {buttonLabel}<Icon name={isLast ? 'check' : 'chevron'} />
        </button>
      </div>
    </main>
  )
}

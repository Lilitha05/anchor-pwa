import { useState } from 'react'
import { isCode } from './Onboarding.jsx'
import { Icon } from './icons.jsx'
import { Toggle } from './ui.jsx'
import { t } from './lang.js'
import LanguagePicker from './LanguagePicker.jsx'
import { checkPin, setPin, setAlertCode, hasAlertCode, wipeAll } from './storage.js'

// removes everything that is not a digit
function onlyDigits(text) {
  return text.replace(/\D/g, '')
}

// Settings is a menu. Each row opens its own page, like Insights does.
export default function Settings({ profile, onChange, onExit, go, lang, onLang }) {
  const [page, setPage] = useState('menu') // menu, language, messages, pin, code, privacy, delete
  const [message, setMessage] = useState('')
  const [currentPin, setCurrentPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [newPin2, setNewPin2] = useState('')
  const [code, setCode] = useState('')
  const [sure, setSure] = useState(false) // true after "Delete everything" is pressed once

  // opens a page and clears any old message
  function open(name) {
    setMessage('')
    setPage(name)
  }

  // changes one field of the profile (for example note, alertMsg or timerMsg)
  function changeField(field, value) {
    const updated = Object.assign({}, profile)
    updated[field] = value
    onChange(updated)
  }

  async function changePin() {
    const correct = await checkPin(currentPin)
    if (!correct) {
      setMessage(t('pWrong'))
      return
    }
    if (!isCode(newPin)) {
      setMessage(t('aDigits'))
      return
    }
    if (newPin !== newPin2) {
      setMessage(t('pNoMatch'))
      return
    }
    await setPin(newPin)
    setCurrentPin('')
    setNewPin('')
    setNewPin2('')
    setMessage(t('pDone'))
  }

  async function changeCode() {
    if (code === '') {
      await setAlertCode('')
      setMessage(t('cRemoved'))
      return
    }
    if (!isCode(code)) {
      setMessage(t('aDigits'))
      return
    }
    const sameAsPin = await checkPin(code)
    if (sameAsPin) {
      setMessage(t('aDiffer'))
      return
    }
    await setAlertCode(code)
    setCode('')
    setMessage(t('cSaved'))
  }

  function deleteEverything() {
    wipeAll()
    onExit()
  }

  // the message box shown at the top of a page
  let messageBox = null
  if (message) {
    messageBox = (
      <div className="notice subtle" aria-live="polite" style={{ marginTop: 0 }}>
        <Icon name="shield" />
        <div><strong>{message}</strong></div>
      </div>
    )
  }

  // the "back to settings" button at the top of every page except the menu
  let backButton = null
  if (page !== 'menu') {
    backButton = (
      <button className="text-button" onClick={function () { open('menu') }}>‹ {t('nav_settings')}</button>
    )
  }

  // ---------- The menu ----------
  if (page === 'menu') {
    const rows = [
      ['language', t('mLang')],
      ['messages', t('mMsgs')],
      ['pin', t('mPin')],
      ['code', t('mCode')],
      ['insights', t('mInsights')],
      ['privacy', t('mPrivacy')],
      ['delete', t('mDelete')],
    ]
    return (
      <section className="page-content">
        <div className="eyebrow">{t('chEyebrow')}</div>
        <h1>{t('sTitle')}</h1>
        <div className="settings-list">
          {rows.map(function (row) {
            return (
              <button key={row[0]} onClick={function () { if (row[0] === 'insights') { go('insights') } else { open(row[0]) } }}>
                <span>{row[1]}</span><Icon name="chevron" />
              </button>
            )
          })}
        </div>
      </section>
    )
  }

  // ---------- Language ----------
  if (page === 'language') {
    return (
      <section className="page-content">
        {backButton}
        <div className="eyebrow">{t('nav_settings')}</div>
        <h1>{t('mLang')}</h1>
        <LanguagePicker lang={lang} onChange={onLang} />
      </section>
    )
  }

  // ---------- Messages ----------
  if (page === 'messages') {
    return (
      <section className="page-content">
        {backButton}
        <div className="eyebrow">{t('nav_settings')}</div>
        <h1>{t('mMsgs')}</h1>
        <p className="lead compact">{t('sMsgsLead')}</p>
        <div className="inline-form">
          <label className="field-label" htmlFor="s-note">{t('sNote')}</label>
          <textarea className="text-field" id="s-note" rows={2} maxLength="140" value={profile.note}
            onChange={function (e) { changeField('note', e.target.value) }} />
          <label className="field-label" htmlFor="s-alert">{t('aMsgLabel')}</label>
          <textarea className="text-field" id="s-alert" rows={2} maxLength="140" value={profile.alertMsg}
            onChange={function (e) { changeField('alertMsg', e.target.value) }} />
          <label className="field-label" htmlFor="s-timer">{t('sTimerMsg')}</label>
          <textarea className="text-field" id="s-timer" rows={2} maxLength="140" value={profile.timerMsg}
            onChange={function (e) { changeField('timerMsg', e.target.value) }} />
        </div>
      </section>
    )
  }

  // ---------- Change PIN ----------
  if (page === 'pin') {
    return (
      <section className="page-content">
        {backButton}
        <div className="eyebrow">{t('nav_settings')}</div>
        <h1>{t('mPin')}</h1>
        {messageBox}
        <div className="inline-form">
          <label className="field-label" htmlFor="p-cur">{t('pCur')}</label>
          <input className="text-field" id="p-cur" type="password" inputMode="numeric" maxLength="8" value={currentPin}
            onChange={function (e) { setCurrentPin(onlyDigits(e.target.value)) }} />
          <label className="field-label" htmlFor="p-1">{t('pNew')}</label>
          <input className="text-field" id="p-1" type="password" inputMode="numeric" maxLength="8" value={newPin}
            onChange={function (e) { setNewPin(onlyDigits(e.target.value)) }} />
          <label className="field-label" htmlFor="p-2">{t('pNew2')}</label>
          <input className="text-field" id="p-2" type="password" inputMode="numeric" maxLength="8" value={newPin2}
            onChange={function (e) { setNewPin2(onlyDigits(e.target.value)) }} />
          <button className="secondary-button full" onClick={changePin}>{t('mPin')}</button>
        </div>
      </section>
    )
  }

  // ---------- Alert code ----------
  if (page === 'code') {
    let status = t('cNotSet')
    if (hasAlertCode()) {
      status = t('cSet')
    }
    return (
      <section className="page-content">
        {backButton}
        <div className="eyebrow">{t('nav_settings')}</div>
        <h1>{t('mCode')} {status}</h1>
        <p className="lead compact">{t('cLead2')}</p>
        {messageBox}
        <div className="inline-form">
          <label className="field-label" htmlFor="a-code">{t('cNew')}</label>
          <input className="text-field" id="a-code" type="password" inputMode="numeric" maxLength="8" value={code}
            onChange={function (e) { setCode(onlyDigits(e.target.value)) }} />
          <button className="secondary-button full" onClick={changeCode}>{t('cSave')}</button>
        </div>
      </section>
    )
  }

  // ---------- Privacy and trends ----------
  if (page === 'privacy') {
    return (
      <section className="page-content">
        {backButton}
        <div className="eyebrow">{t('nav_settings')}</div>
        <h1>{t('mPrivacy')}</h1>
        <div className="settings-group">
          <Toggle title={t('trendsName')} detail={t('trendsDetail')}
            checked={profile.trends} onChange={function (value) { changeField('trends', value) }} />
        </div>
        <p className="muted-note">{t('trendsWhy')}</p>
        <div className="honest-note">
          <Icon name="shield" />
          <p>{t('honest')}</p>
        </div>
      </section>
    )
  }

  // ---------- Delete everything ----------
  return (
    <section className="page-content">
      {backButton}
      <div className="eyebrow">{t('nav_settings')}</div>
      <h1>{t('mDelete')}</h1>
      {!sure && (
        <button className="danger-button" onClick={function () { setSure(true) }}>{t('dDelete')}</button>
      )}
      {sure && (
        <div className="inline-form">
          <strong>{t('dAsk')}</strong>
          <p className="muted-note" style={{ margin: 0 }}>{t('dWarn')}</p>
          <button className="danger-button" onClick={deleteEverything}>{t('dYes')}</button>
          <button className="text-button centered" onClick={function () { setSure(false) }}>{t('dNo')}</button>
        </div>
      )}
    </section>
  )
}

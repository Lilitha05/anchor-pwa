import { useEffect, useRef, useState } from 'react'
import Calculator from './Calculator.jsx'
import { Home, Green, Amber } from './Flows.jsx'
import Onboarding, { CircleEditor, CountPill } from './Onboarding.jsx'
import SendScreen from './Alert.jsx'
import Timer from './Timer.jsx'
import Insights from './Insights.jsx'
import Support from './Support.jsx'
import Settings from './Settings.jsx'
import Toast from './Toast.jsx'
import { getLang, setLang, t } from './lang.js'
import { TopBar, BottomNav } from './ui.jsx'
import { getProfile, saveProfile, setPin, setAlertCode, logEvent } from './storage.js'
import { checkTimer } from './timer.js'
import { sendQuietly } from './messages.js'

// The screens: calculator, setup, home, green, amber, alert, timer, circle, support, settings, insights

// Titles shown in the top bar for some screens
const TITLES = {
  green: 'titleGreen',
  amber: 'titleAmber',
  alert: 'titleAlert',
  timer: 'titleTimer',
}

// Which bottom tab is highlighted for each screen
const NAV_SCREENS = {
  home: 'home',
  circle: 'circle',
  support: 'support',
  settings: 'settings',
  insights: 'settings',
}

export default function App() {
  const [screen, setScreen] = useState('calculator')
  const [profile, setProfile] = useState(getProfile)
  const [pendingPin, setPendingPin] = useState(null) // the first PIN, waiting to be confirmed in setup
  const [toast, setToast] = useState(null) // { text, good } or null
  const [lang, setLangState] = useState(getLang) // en, xh or af
  const toastTimer = useRef(null) // so a new message replaces the old one cleanly

  // saves the profile and updates the screen
  function update(newProfile) {
    saveProfile(newProfile)
    setProfile(newProfile)
  }

  // changes the language and redraws the screen
  function changeLang(code) {
    setLang(code)
    setLangState(code)
  }

  // goes back to the calculator
  function exit() {
    setPendingPin(null)
    setScreen('calculator')
  }

  // tell the browser which language the page is in (helps screen readers)
  useEffect(function () {
    document.documentElement.lang = lang
  }, [lang])

  useEffect(function () {
    // if the person leaves the app (switches tab or app), show the calculator
    function hideApp() {
      if (document.hidden) {
        exit()
      }
    }
    document.addEventListener('visibilitychange', hideApp)

    // check the Stay With Me timer every second while the page is open
    const interval = setInterval(checkTimer, 1000)

    return function () {
      document.removeEventListener('visibilitychange', hideApp)
      clearInterval(interval)
    }
  }, [])

  // shows a message at the top for a few seconds, then removes it
  function showToast(text, good, seconds) {
    clearTimeout(toastTimer.current)
    setToast({ text: text, good: good })
    toastTimer.current = setTimeout(function () {
      setToast(null)
    }, seconds * 1000)
  }

  // shows "Sending…" straight away. The real result (sent or not sent) replaces it.
  function showSending() {
    clearTimeout(toastTimer.current)
    setToast({ text: t('toastSending'), good: true })
  }

  // Emergency code: send the alert message straight away, no countdown, then show the result
  async function sendAlertNow() {
    logEvent('alert')
    showSending()
    const saved = getProfile()
    const result = await sendQuietly(saved.circle, saved.alertMsg)
    if (result === 'sent') {
      showToast(t('toastAlertSent'), true, 1.5)
    } else if (result === 'nocircle') {
      showToast(t('toastNoCircle'), false, 5)
    } else {
      showToast(t('toastAlertFailed'), false, 6)
    }
  }

  // Red: send the agreed note in the background and show the result in a toast
  async function sendRed() {
    showSending()
    const result = await sendQuietly(profile.circle, profile.note)
    if (result === 'sent') {
      showToast(t('toastSent'), true, 1.5)
    } else if (result === 'nocircle') {
      showToast(t('toastNoCircle'), false, 5)
    } else {
      showToast(t('toastFailed'), false, 6)
    }
  }

  // called when the person chooses Green, Amber or Red on the home screen
  function pick(choice) {
    logEvent(choice)
    if (choice === 'red') {
      exit() // back to the calculator straight away
      sendRed()
    } else {
      setScreen(choice)
    }
  }

  // ---------- Calculator ----------
  if (screen === 'calculator') {
    function firstPin(pin) {
      setProfile(getProfile())
      setPendingPin(pin)
      setScreen('setup')
    }
    function unlock() {
      const saved = getProfile()
      setProfile(saved)
      if (saved.done) {
        setScreen('home')
      } else {
        setScreen('setup')
      }
    }
    function startAlert() {
      sendAlertNow()
    }
    return (
      <>
        <Toast text={toast && toast.text} good={toast && toast.good} />
        <Calculator onFirstPin={firstPin} onUnlock={unlock} onAlert={startAlert} />
      </>
    )
  }

  // ---------- First-time setup ----------
  if (screen === 'setup') {
    async function finishSetup(newProfile, codes) {
      if (codes.pin) {
        await setPin(codes.pin)
      }
      if (codes.code) {
        await setAlertCode(codes.code)
      }
      update(newProfile)
      setPendingPin(null)
      setScreen('home')
    }
    return <Onboarding initial={profile} pendingPin={pendingPin} onDone={finishSetup} exit={exit} lang={lang} onLang={changeLang} />
  }

  // ---------- All the other screens ----------
  function goHome() {
    setScreen('home')
  }

  function changeCircle(newCircle) {
    update(Object.assign({}, profile, { circle: newCircle }))
  }

  let body = null
  if (screen === 'home') {
    body = <Home go={setScreen} pick={pick} />
  } else if (screen === 'green') {
    body = <Green circle={profile.circle} />
  } else if (screen === 'amber') {
    body = <Amber profile={profile} onDone={exit} back={goHome} />
  } else if (screen === 'alert') {
    body = <SendScreen contacts={profile.circle} profile={profile} kind="alert" countdown={5} onDone={exit} />
  } else if (screen === 'timer') {
    body = <Timer profile={profile} back={goHome} exit={exit} go={setScreen} />
  } else if (screen === 'circle') {
    body = (
      <section className="page-content">
        <div className="section-title-row">
          <div>
            <div className="eyebrow">{t('circEyebrow')}</div>
            <h1>{t('circTitle')}</h1>
          </div>
          <CountPill n={profile.circle.length} />
        </div>
        <p className="lead compact">{t('circLead')}</p>
        <CircleEditor circle={profile.circle} note={profile.note} onChange={changeCircle} />
      </section>
    )
  } else if (screen === 'support') {
    body = <Support />
  } else if (screen === 'settings') {
    body = <Settings profile={profile} onChange={update} onExit={exit} go={setScreen} lang={lang} onLang={changeLang} />
  } else if (screen === 'insights') {
    body = <Insights />
  }

  const activeTab = NAV_SCREENS[screen]
  let title = ''
  if (TITLES[screen]) {
    title = t(TITLES[screen])
  }
  if (!title && activeTab) {
    title = 'Anchor'
  }
  if (!title) {
    title = ''
  }

  // which way the back arrow goes (none on the main tabs)
  let onBack = undefined
  if (screen === 'insights') {
    onBack = function () { setScreen('settings') }
  } else if (TITLES[screen] && screen !== 'alert') {
    onBack = goHome
  }

  let mainClass = 'app-screen'
  if (activeTab) {
    mainClass = 'app-screen with-nav'
  }

  return (
    <main className={mainClass}>
      <Toast text={toast && toast.text} good={toast && toast.good} />
      <TopBar title={title} onBack={onBack} onExit={exit} />
      {body}
      {activeTab && <BottomNav active={activeTab} go={setScreen} />}
    </main>
  )
}

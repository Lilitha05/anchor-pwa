import { useEffect, useState } from 'react'
import Calculator from './Calculator.jsx'
import { Home, Green, Amber } from './Flows.jsx'
import Onboarding, { CircleEditor, CountPill } from './Onboarding.jsx'
import SendScreen from './Alert.jsx'
import Timer from './Timer.jsx'
import Insights from './Insights.jsx'
import Support from './Support.jsx'
import Settings from './Settings.jsx'
import Toast from './Toast.jsx'
import { TopBar, BottomNav } from './ui.jsx'
import { getProfile, saveProfile, setPin, setAlertCode, logEvent } from './storage.js'
import { checkTimer } from './timer.js'
import { sendQuietly } from './messages.js'

// The screens: calculator, setup, home, green, amber, alert, timer, circle, support, settings, insights

// Titles shown in the top bar for some screens
const TITLES = {
  green: 'I can speak',
  amber: 'Quiet check-in',
  alert: 'Alert',
  timer: 'Stay With Me',
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

  // saves the profile and updates the screen
  function update(newProfile) {
    saveProfile(newProfile)
    setProfile(newProfile)
  }

  // goes back to the calculator
  function exit() {
    setPendingPin(null)
    setScreen('calculator')
  }

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
    setToast({ text: text, good: good })
    setTimeout(function () {
      setToast(null)
    }, seconds * 1000)
  }

  // Red: send the agreed note in the background and show the result in a toast
  async function sendRed() {
    const result = await sendQuietly(profile.circle, profile.note)
    if (result === 'sent') {
      showToast('Check-in sent', true, 3)
    } else if (result === 'nocircle') {
      showToast('No one in your Safe Circle yet', false, 5)
    } else {
      showToast('Check-in NOT sent. Could not reach the alert server.', false, 6)
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
      setProfile(getProfile())
      setScreen('alert')
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
    return <Onboarding initial={profile} pendingPin={pendingPin} onDone={finishSetup} exit={exit} />
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
            <div className="eyebrow">People you trust</div>
            <h1>Your Safe Circle</h1>
          </div>
          <CountPill n={profile.circle.length} />
        </div>
        <p className="lead compact">These people can support you in ways you agree on together.</p>
        <CircleEditor circle={profile.circle} note={profile.note} onChange={changeCircle} />
      </section>
    )
  } else if (screen === 'support') {
    body = <Support />
  } else if (screen === 'settings') {
    body = <Settings profile={profile} onChange={update} onExit={exit} go={setScreen} />
  } else if (screen === 'insights') {
    body = <Insights />
  }

  const activeTab = NAV_SCREENS[screen]
  let title = TITLES[screen]
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

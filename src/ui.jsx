import { Icon } from './icons.jsx'
import { t } from './lang.js'

// The bar at the top of every screen inside the app
export function TopBar({ title, onBack, onExit }) {
  return (
    <header className="topbar">
      <div className="topbar-side">
        {onBack && (
          <button className="icon-button" onClick={onBack} aria-label={t('back')}>
            <Icon name="arrow" />
          </button>
        )}
      </div>
      <div className="topbar-title">{title}</div>
      <div className="topbar-side topbar-side-end">
        <button className="exit-button" onClick={onExit}>{t('exit')}</button>
      </div>
    </header>
  )
}

// [screen name, label, icon name]
const NAV_ITEMS = [
  ['home', 'Home', 'home'],
  ['circle', 'Circle', 'people'],
  ['support', 'Support', 'support'],
  ['settings', 'Settings', 'settings'],
]

// The bar at the bottom with the four main tabs
export function BottomNav({ active, go }) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      {NAV_ITEMS.map(function (item) {
        const screen = item[0]
        const label = item[1]
        const icon = item[2]
        let className = 'nav-item'
        if (active === screen) {
          className = 'nav-item active'
        }
        return (
          <button key={screen} className={className} onClick={function () { go(screen) }}>
            <Icon name={icon} size={21} />
            <span>{t('nav_' + screen)}</span>
          </button>
        )
      })}
    </nav>
  )
}

// An on/off switch with a title and a small description
export function Toggle({ title, detail, checked, onChange }) {
  let switchClass = 'toggle'
  if (checked) {
    switchClass = 'toggle on'
  }
  return (
    <button className="toggle-row" role="switch" aria-checked={checked} onClick={function () { onChange(!checked) }}>
      <span><strong>{title}</strong><small>{detail}</small></span>
      <span className={switchClass} aria-hidden="true"><span /></span>
    </button>
  )
}

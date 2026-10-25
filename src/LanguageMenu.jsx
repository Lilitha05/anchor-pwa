import { LANGS } from './lang.js'

// A small language drop-down for the top right corner of the setup screens.
export default function LanguageMenu({ lang, onChange }) {
  return (
    <select className="lang-menu" aria-label="Language · Ulwimi · Taal" value={lang}
      onChange={function (e) { onChange(e.target.value) }}>
      {LANGS.map(function (item) {
        return <option key={item[0]} value={item[0]}>{item[1]}</option>
      })}
    </select>
  )
}

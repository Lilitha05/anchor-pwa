import { LANGS } from './lang.js'

// Three buttons to choose the language.
// The label is in all three languages so anyone can find it.
export default function LanguagePicker({ lang, onChange }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label className="field-label">Language · Ulwimi · Taal</label>
      <div className="filter-row">
        {LANGS.map(function (item) {
          let className = 'filter'
          if (lang === item[0]) {
            className = 'filter active'
          }
          return (
            <button key={item[0]} className={className} onClick={function () { onChange(item[0]) }}>
              {item[1]}
            </button>
          )
        })}
      </div>
    </div>
  )
}

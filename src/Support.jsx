import { useState } from 'react'
import { directory, helplines } from './data.js'
import { Icon } from './icons.jsx'
import { t } from './lang.js'
import { categoryName, provinceName, languageList, hoursText, helplineName } from './dataText.js'

// The support directory. The services are fictional demo entries for this prototype.
export default function Support() {
  const [category, setCategory] = useState('All')

  // build the list of categories (each one only once)
  const categories = ['All']
  for (let i = 0; i < directory.length; i++) {
    if (!categories.includes(directory[i].category)) {
      categories.push(directory[i].category)
    }
  }

  // only show the services in the chosen category
  const shown = directory.filter(function (d) {
    return category === 'All' || d.category === category
  })

  return (
    <section className="page-content">
      <div className="eyebrow">{t('sdEyebrow')}</div>
      <h1>{t('sdTitle')}</h1>
      <p className="lead compact">{t('sdLead')}</p>

      <div className="call-list" style={{ marginBottom: 24 }}>
        {helplines.map(function (h) {
          return (
            <a key={h.id} className="call-card" href={'tel:' + h.number}>
              <span className="call-icon"><Icon name="call" /></span>
              <span><strong>{helplineName(h)}</strong><small>{h.number}</small></span>
              <Icon name="chevron" />
            </a>
          )
        })}
      </div>

      <div className="filter-row">
        {categories.map(function (c) {
          let className = 'filter'
          if (category === c) {
            className = 'filter active'
          }
          let label = categoryName(c)
          if (c === 'All') {
            label = t('sdAll')
          }
          return (
            <button key={c} className={className} onClick={function () { setCategory(c) }}>{label}</button>
          )
        })}
      </div>
      <p className="muted-note" style={{ marginTop: 0 }}>{t('sdNote')}</p>
      <div className="service-list">
        {shown.map(function (d) {
          return (
            <article className="service-card" key={d.id}>
              <div className="service-top">
                <span className="service-category">{categoryName(d.category)}</span>
                <span className="verified">{t('sdDemo')}</span>
              </div>
              <h2>{d.name}</h2>
              <p>{provinceName(d.province)} · {languageList(d.language)}</p>
              <small>{hoursText(d.hours)}</small>
            </article>
          )
        })}
      </div>
    </section>
  )
}

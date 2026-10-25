import { useState } from 'react'
import { directory, helplines } from './data.js'
import { Icon } from './icons.jsx'

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
      <div className="eyebrow">Support directory</div>
      <h1>Find help that fits.</h1>
      <p className="lead compact">Browse without sharing your location or personal details.</p>

      <div className="call-list" style={{ marginBottom: 24 }}>
        {helplines.map(function (h) {
          return (
            <a key={h.id} className="call-card" href={'tel:' + h.number}>
              <span className="call-icon"><Icon name="call" /></span>
              <span><strong>{h.label}</strong><small>{h.number}</small></span>
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
          return (
            <button key={c} className={className} onClick={function () { setCategory(c) }}>{c}</button>
          )
        })}
      </div>
      <p className="muted-note" style={{ marginTop: 0 }}>
        The services below are fictional demo entries for this prototype. They are not real organisations and have not been verified.
      </p>
      <div className="service-list">
        {shown.map(function (d) {
          return (
            <article className="service-card" key={d.id}>
              <div className="service-top">
                <span className="service-category">{d.category}</span>
                <span className="verified">Fictional demo entry</span>
              </div>
              <h2>{d.name}</h2>
              <p>{d.province} · {d.language}</p>
              <small>{d.hours}</small>
            </article>
          )
        })}
      </div>
    </section>
  )
}

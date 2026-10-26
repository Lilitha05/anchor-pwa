import { useState } from 'react'
import { getLog, clearLog, getProfile } from './storage.js'
import { t } from './lang.js'

const DAY = 86400000 // one day in milliseconds

// true if the time is between 6pm and 5am
function isEvening(time) {
  const hour = new Date(time).getHours()
  return hour >= 18 || hour < 5
}

// counts the events of one type in a list
function countType(events, type) {
  let total = 0
  for (let i = 0; i < events.length; i++) {
    if (events[i].type === type) {
      total = total + 1
    }
  }
  return total
}

// Looks at the log saved on this phone and makes a list of simple tips.
// It only uses fixed rules, nothing is uploaded and nothing is guessed by AI.
export function buildInsights(log, circleSize, now = Date.now()) {
  const results = []

  // split the log into time windows
  const lastTwoWeeks = log.filter(function (e) {
    return now - e.t <= 14 * DAY
  })
  const lastWeek = log.filter(function (e) {
    return now - e.t <= 7 * DAY
  })
  const weekBefore = log.filter(function (e) {
    return now - e.t > 7 * DAY && now - e.t <= 14 * DAY
  })

  // rule 1: an alert was sent this week
  const alerts = countType(lastWeek, 'alert')
  if (alerts >= 1) {
    results.push({
      title: t('i1T'),
      why: t('i1W', { n: alerts }),
    })
  }

  // rule 2: timers ended without a check-in
  const missed = countType(lastTwoWeeks, 'missed')
  if (missed >= 2) {
    results.push({
      title: t('i2T'),
      why: t('i2W', { n: missed }),
    })
  }

  // rule 3: Red used a lot
  const reds = countType(lastTwoWeeks, 'red')
  if (reds >= 3) {
    results.push({
      title: t('i3T'),
      why: t('i3W', { n: reds }),
    })
  }

  // rule 4: most use is in the evening
  const evening = lastTwoWeeks.filter(function (e) {
    return isEvening(e.t)
  })
  if (lastTwoWeeks.length >= 4 && evening.length / lastTwoWeeks.length >= 0.6) {
    results.push({
      title: t('i4T'),
      why: t('i4W', { a: evening.length, b: lastTwoWeeks.length }),
    })
  }

  // rule 5: more use than the week before
  if (lastWeek.length >= 3 && lastWeek.length > weekBefore.length) {
    results.push({
      title: t('i5T'),
      why: t('i5W', { a: lastWeek.length, b: weekBefore.length }),
    })
  }

  // rule 6: very small circle
  if (lastTwoWeeks.length > 0 && circleSize < 2) {
    results.push({
      title: t('i6T'),
      why: t('i6W'),
    })
  }

  return results
}

export default function Insights() {
  const [log, setLog] = useState(getLog)
  const profile = getProfile()
  const items = buildInsights(log, profile.circle.length)

  function clearHistory() {
    clearLog()
    setLog([])
  }

  return (
    <section className="page-content">
      <div className="eyebrow">{t('iEyebrow')}</div>
      <h1>{t('iTitle')}</h1>
      <p className="lead compact">{t('iLead')}</p>
      <div className="service-list">
        {items.length === 0 && (
          <div className="insight"><strong>{t('iNone')}</strong><p>{t('iNoneP')}</p></div>
        )}
        {items.map(function (item) {
          return (
            <div className="insight" key={item.title}>
              <strong>{item.title}</strong>
              <p>{item.why}</p>
            </div>
          )
        })}
      </div>
      <p className="muted-note">{t('iCount', { n: log.length })}</p>
      {log.length > 0 && (
        <button className="secondary-button full" onClick={clearHistory}>{t('iClear')}</button>
      )}
    </section>
  )
}

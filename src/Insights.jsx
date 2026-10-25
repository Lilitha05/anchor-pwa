import { useState } from 'react'
import { getLog, clearLog, getProfile } from './storage.js'

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
      title: 'You used an alert recently',
      why: 'You sent ' + alerts + ' alert(s) in the last 7 days. Check that your circle replied, and consider reviewing your plan.',
    })
  }

  // rule 2: timers ended without a check-in
  const missed = countType(lastTwoWeeks, 'missed')
  if (missed >= 2) {
    results.push({
      title: 'Check-in timers ended without a check-in',
      why: missed + ' timers ended unconfirmed in 14 days. You may want a shorter timer, or to tell your circle what to do when one ends.',
    })
  }

  // rule 3: Red used a lot
  const reds = countType(lastTwoWeeks, 'red')
  if (reds >= 3) {
    results.push({
      title: 'You often needed to stay hidden',
      why: 'You chose Red ' + reds + ' times in 14 days. A support organisation can help you plan safely. See the Support list.',
    })
  }

  // rule 4: most use is in the evening
  const evening = lastTwoWeeks.filter(function (e) {
    return isEvening(e.t)
  })
  if (lastTwoWeeks.length >= 4 && evening.length / lastTwoWeeks.length >= 0.6) {
    results.push({
      title: 'Most of your activity is in the evening',
      why: evening.length + ' of ' + lastTwoWeeks.length + ' uses in 14 days were between 6pm and 5am. You could agree an evening plan with your circle.',
    })
  }

  // rule 5: more use than the week before
  if (lastWeek.length >= 3 && lastWeek.length > weekBefore.length) {
    results.push({
      title: 'More activity than last week',
      why: lastWeek.length + ' uses this week, compared with ' + weekBefore.length + ' the week before.',
    })
  }

  // rule 6: very small circle
  if (lastTwoWeeks.length > 0 && circleSize < 2) {
    results.push({
      title: 'Your Safe Circle is small',
      why: 'You have fewer than 2 people in your circle. Adding another person gives you more options.',
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
      <div className="eyebrow">On this phone only</div>
      <h1>Insights</h1>
      <p className="lead compact">
        Anchor looks for patterns in how you use it. Nothing leaves your phone, and no message text is ever recorded.
      </p>
      <div className="service-list">
        {items.length === 0 && (
          <div className="insight"><strong>Nothing to show yet</strong><p>Insights appear as you use Anchor.</p></div>
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
      <p className="muted-note">{log.length} uses recorded (time and type only).</p>
      {log.length > 0 && (
        <button className="secondary-button full" onClick={clearHistory}>Clear this history</button>
      )}
    </section>
  )
}

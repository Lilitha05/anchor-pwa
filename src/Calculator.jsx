import { useRef, useState } from 'react'
import { t } from './lang.js'
import { hasPin, checkPin, checkAlertCode, lockedUntil, registerFail, clearFails } from './storage.js'

// Each key is [label, type]. The type is only used for the colour.
const keys = [
  ['AC', 'utility'], ['±', 'utility'], ['%', 'utility'], ['÷', 'operator'],
  ['7', ''], ['8', ''], ['9', ''], ['×', 'operator'],
  ['4', ''], ['5', ''], ['6', ''], ['−', 'operator'],
  ['1', ''], ['2', ''], ['3', ''], ['+', 'operator'],
  ['0', 'zero'], ['.', ''], ['=', 'operator'],
]

// does one sum
function calculate(a, b, op) {
  if (op === '+') {
    return a + b
  }
  if (op === '−') {
    return a - b
  }
  if (op === '×') {
    return a * b
  }
  if (op === '÷') {
    if (b === 0) {
      return NaN
    }
    return a / b
  }
  return b
}

// makes a number safe to show on the screen
function format(n) {
  if (Number.isNaN(n)) {
    return 'Error'
  }
  return String(parseFloat(n.toPrecision(10)))
}

// This looks and works like a normal calculator.
// If the digits typed before "=" match the PIN, the app opens.
export default function Calculator({ onUnlock, onAlert, onFirstPin }) {
  const [display, setDisplay] = useState('0')
  const [saved, setSaved] = useState(null) // the number before the operator
  const [op, setOp] = useState(null)
  const [fresh, setFresh] = useState(true) // true when the next digit starts a new number
  const showHint = !hasPin() // only before a PIN exists. Once setup is finished it never shows again.
  const typed = useRef('') // digits typed since the last operator (this could be the PIN)

  async function press(k) {
    const isDigit = /\d/.test(k)

    if (isDigit) {
      typed.current = typed.current + k
      if (fresh || display === '0') {
        setDisplay(k)
      } else if (display.length < 12) {
        setDisplay(display + k)
      }
      setFresh(false)
      return
    }

    if (k === '.') {
      typed.current = '' // a decimal point breaks up a code, so 43.21 is not 4321
      if (fresh) {
        setDisplay('0.')
        setFresh(false)
      } else if (!display.includes('.')) {
        setDisplay(display + '.')
      }
      return
    }

    if (k === 'AC') {
      setDisplay('0')
      setSaved(null)
      setOp(null)
      setFresh(true)
      typed.current = ''
      return
    }

    if (k === '±') {
      typed.current = '' // so does ±
      setDisplay(format(-parseFloat(display)))
      return
    }

    if (k === '%') {
      typed.current = '' // and %
      setDisplay(format(parseFloat(display) / 100))
      return
    }

    if (k === '=') {
      // Only digits the person typed count as a code.
      // So pressing = on a result is never counted as a wrong try.
      const code = typed.current
      const looksLikeCode = op === null && code.length >= 4 && code.length <= 8
      if (looksLikeCode && Date.now() > lockedUntil()) {
        if (!hasPin()) {
          typed.current = ''
          onFirstPin(code)
          return
        }
        if (await checkPin(code)) {
          clearFails()
          typed.current = ''
          onUnlock()
          return
        }
        if (await checkAlertCode(code)) {
          clearFails()
          typed.current = ''
          // clear the display so the code does not stay on the screen
          setDisplay('0')
          setSaved(null)
          setOp(null)
          setFresh(true)
          onAlert()
          return
        }
        registerFail() // wrong code: act like a normal calculator
      }

      if (op !== null && saved !== null) {
        const result = calculate(saved, parseFloat(display), op)
        setDisplay(format(result))
        setSaved(null)
        setOp(null)
      }
      setFresh(true)
      typed.current = ''
      return
    }

    // anything else is an operator (+ − × ÷)
    const current = parseFloat(display)
    let next = current
    if (saved !== null && op !== null && !fresh) {
      next = calculate(saved, current, op)
    }
    setSaved(next)
    setOp(k)
    setDisplay(format(next))
    setFresh(true)
    typed.current = ''
  }

  return (
    <main className="calculator" aria-label="Calculator">
      <div className="calc-shell">
        {showHint && <p className="first-hint">{t('firstHint')}</p>}
        <div className="calc-display" aria-live="polite">{display}</div>
        <div className="calc-grid">
          {keys.map(function (item) {
            const k = item[0]
            const type = item[1]
            let className = 'calc-key ' + type
            if (op === k && fresh) {
              className = className + ' active'
            }
            let label = k
            if (k === 'AC' && display !== '0') {
              label = 'C'
            }
            return (
              <button key={k} aria-label={k} className={className} onClick={function () { press(k) }}>
                {label}
              </button>
            )
          })}
        </div>
      </div>
    </main>
  )
}

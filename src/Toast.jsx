// Small message at the top of the screen. It disappears by itself (App.jsx clears it).
// good = true shows the teal style, good = false shows the red style.
export default function Toast({ text, good }) {
  if (!text) {
    return null
  }
  return (
    <div className={good ? 'toast good' : 'toast bad'} role="status" aria-live="polite">
      {text}
    </div>
  )
}

import { text } from './strings.js'

// Language support: English, isiXhosa and Afrikaans.
// The chosen language is saved on the phone like everything else.
const LANG_KEY = 'calc.g'

// [code, name shown on the button]. Each language is written in its own name.
export const LANGS = [
  ['en', 'English'],
  ['xh', 'isiXhosa'],
  ['af', 'Afrikaans'],
]

// Gives back the saved language. If none is saved, uses the phone's language if we have it.
export function getLang() {
  const saved = localStorage.getItem(LANG_KEY)
  if (saved && text[saved]) {
    return saved
  }
  const phone = (navigator.language || 'en').substring(0, 2)
  if (text[phone]) {
    return phone
  }
  return 'en'
}

export function setLang(code) {
  localStorage.setItem(LANG_KEY, code)
  document.documentElement.lang = code // helps screen readers pick the right voice
}

// Finds the words for a key in the chosen language. If a word is missing we use English.
// Pieces like {name} are swapped for the values we pass in.
export function t(key, values) {
  let words = text[getLang()][key]
  if (words === undefined) {
    words = text.en[key]
  }
  if (words === undefined) {
    return key
  }
  if (values) {
    for (const name in values) {
      words = words.split('{' + name + '}').join(values[name])
    }
  }
  return words
}

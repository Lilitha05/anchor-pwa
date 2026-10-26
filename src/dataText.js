import { t } from './lang.js'

// The directory data is saved in English. These helpers show it in the chosen language.

export function categoryName(category) {
  return t('cat_' + category)
}

export function provinceName(province) {
  return t('prov_' + province)
}

// "English, isiXhosa" -> each language name translated
export function languageList(text) {
  const names = text.split(', ')
  const shown = names.map(function (name) {
    return t('lng_' + name)
  })
  return shown.join(', ')
}

// "Mon to Fri, 08:00 to 17:00" -> translated, with the same times
export function hoursText(hours) {
  const times = hours.match(/\d\d:\d\d/g)
  if (hours === '24 hours') {
    return t('h24')
  }
  if (hours.startsWith('Mon to Fri') && times) {
    return t('hWeek', { a: times[0], b: times[1] })
  }
  if (hours.startsWith('Daily') && times) {
    return t('hDaily', { a: times[0], b: times[1] })
  }
  return hours
}

// helpline names: the GBV Command Centre is a proper name, the others are translated
export function helplineName(helpline) {
  if (helpline.id === 'police') {
    return t('help_police')
  }
  if (helpline.id === 'emergency') {
    return t('help_emergency')
  }
  return helpline.label
}

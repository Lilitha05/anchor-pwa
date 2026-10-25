// Demo data only. All people and services below are fictional.
export const circle = [
  { id: 1, name: 'Naledi', role: 'Quiet check-in', plan: { amber: 'Message only, no call' } },
  { id: 2, name: 'Thandi', role: 'Transport', plan: {} },
  { id: 3, name: 'Aunty M', role: 'Call me', plan: { green: 'Call' } }
]

// TODO: verify these numbers against official sources before the demo.
export const helplines = [
  { id: 'gbv', label: 'GBV Command Centre', number: '0800428428' },
  { id: 'police', label: 'Police', number: '10111' },
  { id: 'emergency', label: 'Emergency (mobile)', number: '112' }
]

// Demo directory. These entries are FICTIONAL and have no working phone links.
export const directory = [
  { id: 1, name: 'Harbour Light Shelter (demo)', category: 'Shelter', province: 'Eastern Cape', language: 'English, isiXhosa', hours: '24 hours', verified: '2026-10-01', number: '000 000 0001' },
  { id: 2, name: 'Sunrise Counselling (demo)', category: 'Counselling', province: 'Eastern Cape', language: 'English, Afrikaans', hours: 'Mon to Fri, 08:00 to 17:00', verified: '2026-09-20', number: '000 000 0002' },
  { id: 3, name: 'Open Door Legal Aid (demo)', category: 'Legal help', province: 'Gauteng', language: 'English, isiZulu', hours: 'Mon to Fri, 09:00 to 16:00', verified: '2026-09-15', number: '000 000 0003' },
  { id: 4, name: 'Safe Hands Clinic (demo)', category: 'Medical', province: 'Western Cape', language: 'English, Afrikaans, isiXhosa', hours: 'Daily, 07:00 to 19:00', verified: '2026-10-05', number: '000 000 0004' },
  { id: 5, name: 'Kind Voices Helpline (demo)', category: 'Counselling', province: 'KwaZulu-Natal', language: 'English, isiZulu', hours: '24 hours', verified: '2026-10-08', number: '000 000 0005' }
]

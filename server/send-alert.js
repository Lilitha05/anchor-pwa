// Twilio Function: receives messages from the Anchor app and sends them as SMS.
//
// The app sends:  { "messages": [ { "to": "0711234567", "body": "text here" }, ... ] }
// This function answers 200 ONLY if every message was accepted by Twilio.
// Otherwise it answers 500, and the app then says "not sent" (it never pretends).
//
// Set up in the Twilio Console: Functions and Assets -> Services -> Create Service
// -> Add Function, path /send-alert, visibility Public, paste this code.
// Add an environment variable called TWILIO_NUMBER (your Twilio number, like +12025550123).

// Changes a South African number into the +27 format Twilio needs.
// 0711234567 -> +27711234567
function toInternational(number) {
  let n = String(number).replace(/[\s\-()]/g, '')
  if (n.startsWith('+')) {
    return n
  }
  if (n.startsWith('00')) {
    return '+' + n.substring(2)
  }
  if (n.startsWith('0')) {
    return '+27' + n.substring(1)
  }
  if (n.startsWith('27')) {
    return '+' + n
  }
  return '+' + n
}

exports.handler = async function (context, event, callback) {
  const response = new Twilio.Response()
  response.appendHeader('Content-Type', 'application/json')

  // CORS headers, so the browser lets the app call this function
  response.appendHeader('Access-Control-Allow-Origin', '*')
  response.appendHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  response.appendHeader('Access-Control-Allow-Headers', 'Content-Type')

  const messages = event.messages

  // basic checks, so this link cannot be used to send lots of texts
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 10) {
    response.setStatusCode(400)
    response.setBody({ ok: false, error: 'Send between 1 and 10 messages.' })
    return callback(null, response)
  }

  const client = context.getTwilioClient()
  let sent = 0
  let failed = 0

  for (let i = 0; i < messages.length; i++) {
    const to = toInternational(messages[i].to || '')
    const body = String(messages[i].body || '').substring(0, 300) // keep texts short

    // a phone number should be + and then 9 to 15 digits
    if (!/^\+\d{9,15}$/.test(to) || body === '') {
      failed = failed + 1
      continue
    }

    try {
      await client.messages.create({ to: to, from: context.TWILIO_NUMBER, body: body })
      sent = sent + 1
    } catch (error) {
      failed = failed + 1
    }
  }

  if (failed === 0) {
    response.setStatusCode(200)
  } else {
    response.setStatusCode(500)
  }
  response.setBody({ ok: failed === 0, sent: sent, failed: failed })
  return callback(null, response)
}

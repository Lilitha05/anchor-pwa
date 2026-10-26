# Anchor

A discreet safety app for anyone at risk of gender-based violence, at home, on the move, at work or on campus,
who can't safely ask for help out loud. It looks and works like a normal calculator,
and installs on the phone as "Calculator". A secret code opens the real app behind it.

Made by team **Cipher Circle** for the FNB App of the Year Hackathon 2026
(Social Services: gender-based violence safer communities).

## How it works
- Type your PIN (4 to 8 digits) on the calculator and press `=` to open Anchor.
  The first PIN you type becomes your PIN. Until a PIN is set, a small "First time?" hint shows on the calculator, and it disappears once setup is finished. A wrong code just acts like a calculator.
- Type your **emergency (alert) code** and press `=` and the alert is sent straight away,
  with a short "sent" message on screen. The "Send an alert now" button inside the app has a
  5 second countdown so you can cancel.
- Available in English, isiXhosa and Afrikaans. More languages can be added in `src/strings.js`.
- **Green** (I can speak): call people in your Safe Circle or a helpline.
- **Amber** (I can type quietly): send a short agreed note to someone you trust.
- **Red** (my phone may be watched): sends the note and your location to your Safe Circle,
  then goes straight back to the calculator.
- **Stay With Me**: a check-in timer. If it ends before you tap "I'm safe", your Safe Circle is alerted.
  It only works while the app stays open in the browser.
- **Safe Circle**: up to 10 trusted people. You choose who gets your location.
- A support directory and simple on-phone insights.
- Anonymous support trends (opt-in, off by default): coarse area and category only, so support
  organisations can see where help is needed without ever knowing who you are. Planned, not built yet.

## Privacy
- No account and no tracking. Everything is saved in the browser on the phone (localStorage).
- The PIN and alert code are salted and hashed (PBKDF2). Five wrong tries lock the app for 30 seconds.
- Leaving the app puts the calculator back on screen. "Delete everything" is in Settings.
- Honest limit: no app can be completely hidden on a shared phone.
- The support directory entries are fictional demo data for this prototype.

## Sending messages
A web page can't send a text by itself, so the app sends the messages to a small
Twilio Function (`server/send-alert.js`) and Twilio sends the SMS.
Anchor only says "sent" when that server says it worked. If it can't reach the server it says "not sent".
The Twilio keys stay inside Twilio and are never in this code.
Setup steps are in `TWILIO-SETUP.md`.

## Run it on your computer
    npm install
    npm run dev

To build it: copy `.env.example` to `.env`, put your alert server URL in it, then run

    npm run build

and upload the `dist` folder to a host (for example Netlify).
Without a server URL the app still works, but Red shows "not sent"
and the other buttons prepare the text for you to send by hand.

## Folder guide
- `src/` the React app (`Calculator.jsx` is the disguise, `App.jsx` moves between screens)
- `src/storage.js` saves the PIN, Safe Circle and settings
- `src/messages.js` builds the messages and sends them to the server
- `server/send-alert.js` the Twilio Function
- `public/` the app icons

## Built with
React, Vite, a service worker (so it installs like an app), Twilio.
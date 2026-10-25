# Connecting Twilio to Anchor

Anchor is a web page, and a web page cannot send a text by itself.
So the app calls a small function on Twilio, and Twilio sends the SMS.
Until this is connected, Amber / Alert / Stay With Me only *prepare* texts, and Red shows "NOT sent".

## 1. Twilio account
1. Make a free account at twilio.com and verify your own phone number.
2. In the Console, get a Twilio phone number that can send SMS (the trial gives you one).
3. Allow South Africa: Messaging -> Settings -> Geo permissions -> tick South Africa.

**Trial limits (important for the demo):**
- A trial account can only text numbers you have verified (Console -> Phone Numbers -> Verified Caller IDs).
  So verify the phone numbers of the Safe Circle people you use in your demo.
- Trial texts start with "Sent from your Twilio trial account". Upgrading with a few dollars removes that.

## 2. Make the function
1. Console -> Functions and Assets -> Services -> Create Service (use a plain name like `notes-helper`).
2. Add -> Add Function. Set the path to `/send-alert` and visibility to **Public**.
3. Paste in everything from `server/send-alert.js`.
4. Settings -> Environment Variables -> add `TWILIO_NUMBER` = your Twilio number, like `+12025550123`.
5. Click **Deploy All**. Copy the function URL, it looks like `https://notes-helper-1234.twil.io/send-alert`.

## 3. Tell the app where it is
1. In the project folder, copy `.env.example` to a new file named `.env`.
2. Put your function URL after `VITE_ALERT_URL=`.
3. Run `npm run build`, then upload the `dist` folder to your host again (Netlify drop etc.).

The URL is added when the app is BUILT, so you must rebuild after changing it.

## 4. Test it
- Quick test from a terminal (replace the URL and number):

      curl -X POST https://YOUR-URL.twil.io/send-alert -H "Content-Type: application/json" -d '{"messages":[{"to":"0711234567","body":"Test from Anchor"}]}'

  You should get `{"ok":true,"sent":1,"failed":0}` and a text on that phone.
- Then in the app: press Red, and you should see "Check-in sent" on the calculator screen.
- If it says "NOT sent": check the number is verified (trial), the URL is right, and the function is Public.

## Things to know
- Anyone who finds the function URL could try to send texts on your account. The function limits each call to 10 short messages, but set a low balance / usage alert in Twilio so a mistake is cheap.
- Never put your Twilio Auth Token in the app. It only lives inside Twilio (that is why we use a function).
- This function was written without being able to test it against a real Twilio account, so test it before the demo.

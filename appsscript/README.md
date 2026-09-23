# Google Sheets Sync Setup

This lets each user store their study data in their own Google Sheet instead of (or in addition to)
browser localStorage. Every user deploys their own copy of the script under their own Google account —
no shared backend, no OAuth consent screen.

## 1. Create the Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new blank spreadsheet.
2. Name it something like "Study Monitor Data". You don't need to add any tabs or headers manually —
   the script creates them automatically on first sync.

## 2. Add the script

1. In the Sheet, go to **Extensions > Apps Script**.
2. Delete any placeholder code in `Code.gs`.
3. Copy the contents of [`Code.gs`](./Code.gs) from this repo and paste it in.
4. Save the project (Ctrl/Cmd+S). Give it a name like "Study Monitor Sync".

## 3. Deploy as a web app

1. Click **Deploy > New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Configure:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**. Authorize the script when prompted. It will ask for two permissions: access to
   this Sheet, and access to your **default Google Calendar** (used for the calendar-sync feature —
   it reads/creates/updates/deletes events on your main personal calendar, the same one you use day to
   day). Click through the "unverified app" warning (it's your own script on your own account).
5. Copy the **Web app URL** — it looks like `https://script.google.com/macros/s/AKfycb.../exec`.

> The URL itself acts as the access key — anyone with the link can read/write this Sheet's data (and
> your default Calendar) via the app. Don't share it publicly.

> If you deployed this script before the Calendar feature was added and are now updating it, redeploy
> a new version (Deploy > Manage deployments > Edit > New version) and re-authorize when prompted — the
> Calendar permission is only requested the first time the script needs it.

## 4. Connect the app

1. Open the study app's **Settings** page.
2. Turn on **Google Sheets Sync**.
3. Paste the Web app URL into the field.
4. The app pulls any existing data from the Sheet immediately, then keeps both sides in sync automatically
   as you make changes. Use **Sync Now** to force a push at any time.

## 5. Telegram reminders (optional — phone notifications even when the app is closed)

Custom per-course alarms (the ones you set on a course's page) can be sent to your phone via a Telegram
bot, on a schedule that runs independently of whether the app or browser is open. This needs three
one-time manual steps that only you can do — nothing in the app can automate creating a bot or
installing a trigger.

> **If you deployed the script before this feature was added**, sending Telegram messages needs a new
> permission (`UrlFetchApp` / "Connect to an external service") that your original authorization didn't
> grant. If you see `Exception: You do not have permission to call UrlFetchApp.fetch` when testing, do
> **step 5a-re-auth** below before anything else — this is the single most common setup snag here.

### 5a. Create a Telegram bot

1. In Telegram, open a chat with **@BotFather**.
2. Send `/newbot` and follow the prompts (choose a name and a username ending in `bot`).
3. BotFather replies with a **bot token** — a string like `123456789:ABCdefGhIJKlmNoPQRstuVwXYZ`. Copy it.

### 5b. Find your chat ID

1. In Telegram, send any message (e.g. "hi") to the bot you just created.
2. In your browser, visit `https://api.telegram.org/bot<YOUR_TOKEN>/getUpdates` (replace `<YOUR_TOKEN>`
   with the token from step 5a).
3. Look for `"chat":{"id":...}` in the response — that number is your **chat ID**.

### 5c. Add the token + chat ID to the app

1. In the study app's **Settings** page, find **התראות טלגרם** (Telegram Notifications).
2. Paste the bot token and chat ID.
3. Click **שלח הודעת בדיקה** (Send Test Notification) — you should get a message in Telegram within a
   few seconds. If it fails, double check Google Sheets Sync is turned on above and the Web app URL is
   set.
4. **If the test fails with `Exception: You do not have permission to call UrlFetchApp.fetch`**, the
   script needs to be re-authorized for the new permission (this only happens once, the first time
   Telegram support is added to an already-deployed script):
   - In the Apps Script editor, open the function dropdown at the top (next to the ▶ Run button) and
     select `sendTelegramTest` or `sendDueTelegramReminders`.
   - Click **Run** (▶). A permissions dialog should appear listing "Connect to an external service" —
     click through it (choose your account, then "Advanced" > "Go to [project name] (unsafe)" > "Allow"
     if you see the unverified-app warning).
   - Alternatively: **Deploy > Manage deployments** > pencil icon > **Version: New version** > **Deploy**
     also re-triggers the authorization prompt.
   - Go back to the app's Settings page and click **שלח הודעת בדיקה** again.

### 5d. Install the time-driven trigger (the one step Google requires you to do by hand)

This makes `sendDueTelegramReminders()` run automatically every 15 minutes, independent of the app being
open. It cannot be installed by deploying the web app or by running any button in this app — Google
requires it to be added manually, once, in the Apps Script editor:

1. In the Apps Script editor (Extensions > Apps Script), click the **clock icon** ("Triggers") in the
   left sidebar.
2. Click **Add Trigger** (bottom right).
3. Configure:
   - **Choose which function to run:** `sendDueTelegramReminders`
   - **Choose which deployment should run:** Head
   - **Select event source:** Time-driven
   - **Select type of time based trigger:** Minutes timer
   - **Select minute interval:** Every 15 minutes
4. Click **Save**. Authorize if prompted (this trigger needs no new permissions beyond what you already
   granted in step 3).

Once installed, any enabled custom alarm on a course page will send you a Telegram message when its
configured lead time is reached — checked every 15 minutes, so an alarm set for "10 minutes before" may
arrive up to ~15 minutes early or a few minutes late depending on where it falls between trigger runs.

> Only custom per-course alarms go to Telegram right now. Class lead-time reminders and assignment
> deadline warnings still only show as browser notifications while the app is open (Settings >
> תזכורות והתראות) — ask if you want those on Telegram too.

## Notes

- Each collection (courses, events, tasks, study history, heatmap, alarms, settings) gets its own tab in
  the Sheet, created automatically.
- If you ever redeploy the script (Deploy > Manage deployments > Edit > New version), the URL stays the
  same, so you don't need to update it in the app. Triggers installed via step 5d also survive a redeploy.
- To point the app at a different Sheet, make a fresh copy of this setup and paste the new URL in Settings —
  you'll need to repeat step 5d (triggers are per-script, not per-deployment).

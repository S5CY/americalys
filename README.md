# AmeriCal Youth Symphony

Public website for AmeriCal Youth Symphony, a San Diego youth orchestra founded in 2017 by Music Director and Founding Conductor Dr. Sheng Yang.

## Pages

- `index.html` — orchestra story, events, rehearsals, and ways to join.
- `checkin.html` — rehearsal attendance with placeholder members. Check-ins are saved in the browser for the current day.

## Updating the roster

In `checkin.html`, find the labels inside `<div id="roster">`. Replace `Person 1`, `Person 2`, and `Person 3` with member names and replace `Instrument / Section` with each member's instrument or section. Duplicate a label to add another member and keep each checkbox `value` unique.

## Previewing locally

Serve the repository as a static site, then open `index.html`. It is compatible with GitHub Pages and the repository's existing Jekyll setup.

The initial orchestra copy, dates, addresses, and photos were adapted from [americalys.org](https://www.americalys.org/). Verify event details before publishing, since dates may change.

## Attendance prototype

- `checkin.html` walks members through family, section, name, Saturday rehearsal date, and rehearsal code.
- `admin.html` shows submitted codes and lets staff approve, reject, filter, or reset entries.
- `assets/js/roster.js` is the single roster source and currently contains 73 members. Strings are grouped by instrument, with Violin opening into Violin 1 and Violin 2.

Before the Google Apps Script endpoint is configured, check-in displays a setup error and does not claim to save attendance. Once configured, Google Sheets is the shared source of truth across student and admin devices.

Farrah and Selina are listed without last names in the supplied roster.

## Google Sheets sync setup

The repository includes a Google Apps Script backend in `google-apps-script/Code.gs`. It uses the temporary **Americal Check In** spreadsheet as a shared database and supports automatic approval, date-specific codes, time windows, duplicate blocking, and rejected-attempt logging.

1. Open the spreadsheet and choose **Extensions → Apps Script**.
2. Replace the editor contents with `google-apps-script/Code.gs` and set the project time zone to America/Los_Angeles.
3. In **Project Settings → Script Properties**, create `ADMIN_KEY` with a private random value. Never commit this value to GitHub.
4. Run `setupAttendanceSystem` once and approve Google's requested spreadsheet access. This creates and formats Members, Sessions, Attendance, and Attempts tabs, seeds the 73-member roster, and generates a unique six-digit member PIN for each person. Distribute PINs privately.
5. Choose **Deploy → New deployment → Web app**. Execute as yourself and allow access to anyone. Copy the URL ending in `/exec`.
6. Paste that URL into `assets/js/attendance-config.js`, commit, and push.

Admins can then create a Saturday session from `admin.html`, setting its code and opening/closing times. A correct member PIN plus the correct rehearsal code inside the active window is approved automatically and written to the Attendance tab. Incorrect PIN, incorrect code, expired, duplicate, and inactive-session attempts are recorded in Attempts without storing either submitted secret.

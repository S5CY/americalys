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
- `assets/js/roster.js` is the single roster source and currently contains the 74 members supplied in the typed August 2026 roster.

This version stores submissions in browser storage, so the student and admin pages must be opened in the same browser to share data. Before live use across separate phones, replace the storage layer with a shared database and add authenticated admin access.

The supplied roster lists Michelle Yu and Eric Wang as Violin without a numbered section, and lists Farrah and Selina without last names.

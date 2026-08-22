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

const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('#site-nav');
menuButton?.addEventListener('click', () => { const open = menuButton.getAttribute('aria-expanded') === 'true'; menuButton.setAttribute('aria-expanded', String(!open)); navigation?.classList.toggle('open', !open); });
navigation?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => { navigation.classList.remove('open'); menuButton?.setAttribute('aria-expanded', 'false'); }));
const observer = new IntersectionObserver((entries) => { entries.forEach((entry) => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }); }, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
const year = document.querySelector('#year'); if (year) year.textContent = new Date().getFullYear();
document.querySelectorAll('.footer-links a').forEach((link) => { if (link.textContent.trim().toLowerCase() === 'email us') link.href = 'mailto:americalyouthorcestra@gmail.com'; });
const today = document.querySelector('#today'); if (today) today.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date());
const roster = document.querySelector('#roster'); const count = document.querySelector('#checked-count'); const confirmation = document.querySelector('#confirmation'); const storageKey = `americalys-attendance-${new Date().toISOString().slice(0, 10)}`;
if (roster && count) { const saved = JSON.parse(localStorage.getItem(storageKey) || '[]'); roster.querySelectorAll('input').forEach((input) => { input.checked = saved.includes(input.value); }); count.textContent = saved.length; roster.addEventListener('change', () => { const checked = [...roster.querySelectorAll('input:checked')].map((input) => input.value); count.textContent = checked.length; localStorage.setItem(storageKey, JSON.stringify(checked)); confirmation?.classList.add('show'); window.clearTimeout(window.confirmationTimer); window.confirmationTimer = window.setTimeout(() => confirmation?.classList.remove('show'), 2200); }); }

const calendarGrid = document.querySelector('#calendar-grid');
const calendarMonth = document.querySelector('#calendar-month');
const calendarPrevious = document.querySelector('#calendar-prev');
const calendarNext = document.querySelector('#calendar-next');
if (calendarGrid && calendarMonth && calendarPrevious && calendarNext) {
  const firstDate = new Date(2026, 4, 1);
  const now = new Date();
  let displayedYear = Math.max(2026, now.getFullYear());
  let displayedMonth = displayedYear === 2026 ? Math.max(4, now.getMonth()) : now.getMonth();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const renderCalendar = () => {
    calendarMonth.textContent = `${monthNames[displayedMonth]} ${displayedYear}`;
    calendarGrid.replaceChildren();
    dayNames.forEach((name) => { const heading = document.createElement('span'); heading.className = 'calendar-day-name'; heading.textContent = name; calendarGrid.append(heading); });
    const firstWeekday = new Date(displayedYear, displayedMonth, 1).getDay();
    const daysInMonth = new Date(displayedYear, displayedMonth + 1, 0).getDate();
    for (let index = 0; index < firstWeekday; index += 1) { const empty = document.createElement('span'); empty.className = 'calendar-empty'; empty.setAttribute('aria-hidden', 'true'); calendarGrid.append(empty); }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const isSaturday = new Date(displayedYear, displayedMonth, day).getDay() === 6;
      const isSpecialEvent = displayedYear === 2026 && displayedMonth === 10 && day === 28;
      const cell = document.createElement(isSaturday || isSpecialEvent ? 'a' : 'span');
      cell.textContent = day;
      if (isSpecialEvent) {
        cell.className = 'calendar-event-day'; cell.href = '#future-events';
        cell.setAttribute('aria-label', 'Three special events on November 28');
        const note = document.createElement('small'); note.textContent = '3 events'; cell.append(note);
      } else if (isSaturday) {
        cell.className = 'calendar-rehearsal-day'; cell.href = 'educational-rehearsal.html';
        cell.setAttribute('aria-label', `Weekly rehearsal on ${monthNames[displayedMonth]} ${day} from 7 to 9 pm`);
        const note = document.createElement('small'); note.textContent = 'Rehearsal'; cell.append(note);
      }
      calendarGrid.append(cell);
    }
    calendarPrevious.disabled = displayedYear === firstDate.getFullYear() && displayedMonth === firstDate.getMonth();
    calendarNext.disabled = false;
  };
  calendarPrevious.addEventListener('click', () => { if (!calendarPrevious.disabled) { displayedMonth -= 1; if (displayedMonth < 0) { displayedMonth = 11; displayedYear -= 1; } renderCalendar(); } });
  calendarNext.addEventListener('click', () => { displayedMonth += 1; if (displayedMonth > 11) { displayedMonth = 0; displayedYear += 1; } renderCalendar(); });
  renderCalendar();
}

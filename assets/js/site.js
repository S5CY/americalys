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

const aboutMenu = document.querySelector('.about-menu');
document.addEventListener('click', (event) => {
  if (aboutMenu && !aboutMenu.contains(event.target)) aboutMenu.open = false;
});
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && aboutMenu?.open) {
    aboutMenu.open = false;
    aboutMenu.querySelector('summary').focus();
  }
});

const calendarGrid = document.querySelector('#calendar-grid');
const calendarMonth = document.querySelector('#calendar-month');
const calendarPrevious = document.querySelector('#calendar-prev');
const calendarNext = document.querySelector('#calendar-next');
const calendarJump = document.querySelector('#calendar-jump');
if (calendarGrid && calendarMonth && calendarPrevious && calendarNext) {
  const firstMonth = '2023-04';
  const now = new Date();
  const requested = new URLSearchParams(location.search).get('month');
  const validMonth = (value) => /^\d{4}-(0[1-9]|1[0-2])$/.test(value || '') && value >= firstMonth;
  const initial = validMonth(requested) ? requested : `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
  let [displayedYear, monthNumber] = initial.split('-').map(Number);
  let displayedMonth = monthNumber - 1;
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const archive = [...(window.americalArchive || []), { date:'2026-03-14', title:'Rancho Peñasquitos Library', id:'library-2026', href:'rancho-penasquitos-library.html' }];
  const agenda = document.createElement('div');
  agenda.className = 'calendar-agenda';
  agenda.setAttribute('aria-label', 'Performances this month');
  calendarGrid.after(agenda);
  const renderCalendar = () => {
    const monthKey = `${displayedYear}-${String(displayedMonth + 1).padStart(2,'0')}`;
    calendarMonth.textContent = `${monthNames[displayedMonth]} ${displayedYear}`;
    if (calendarJump) calendarJump.value = monthKey;
    calendarGrid.replaceChildren();
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach((name) => {
      const heading = document.createElement('span');
      heading.className = 'calendar-day-name'; heading.textContent = name;
      calendarGrid.append(heading);
    });
    const firstWeekday = new Date(displayedYear, displayedMonth, 1).getDay();
    const daysInMonth = new Date(displayedYear, displayedMonth + 1, 0).getDate();
    for (let i = 0; i < firstWeekday; i++) {
      const empty = document.createElement('span'); empty.className = 'calendar-empty';
      empty.setAttribute('aria-hidden','true'); calendarGrid.append(empty);
    }
    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${monthKey}-${String(day).padStart(2,'0')}`;
      const dayEvents = archive.filter((event) => event.date === key);
      const isSaturday = key >= '2026-05-01' && new Date(displayedYear, displayedMonth, day).getDay() === 6;
      const cell = document.createElement('div'); cell.className = 'calendar-cell';
      const dayLabel = document.createElement('span'); dayLabel.textContent = day;
      cell.append(dayLabel);
      const addLink = (title, href, kind) => {
        const link = document.createElement('a'); link.href = href; link.className = kind;
        const fullLabel = document.createElement('span');
        fullLabel.className = 'calendar-title-long'; fullLabel.textContent = title;
        const shortLabel = document.createElement('span');
        shortLabel.className = 'calendar-title-short'; shortLabel.textContent = kind === 'calendar-performance' ? 'Event' : 'Reh.';
        link.append(fullLabel, shortLabel);
        link.setAttribute('aria-label', `${title}, ${monthNames[displayedMonth]} ${day}, ${displayedYear}`);
        cell.append(link);
      };
      dayEvents.forEach((event) => addLink(event.title, event.href || `history.html#${event.id}`, 'calendar-performance'));
      if (key === '2026-11-28') addLink('3 events', '#future-events', 'calendar-performance');
      if (isSaturday) addLink('Rehearsal', 'educational-rehearsal.html', 'calendar-rehearsal');
      if (key === `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`) cell.setAttribute('aria-current','date');
      calendarGrid.append(cell);
    }
    agenda.replaceChildren();
    archive.filter(event => event.date?.startsWith(monthKey)).forEach(event => {
      const link = document.createElement('a');
      link.href = event.href || `history.html#${event.id}`;
      link.textContent = `${monthNames[displayedMonth]} ${Number(event.date.slice(-2))} · ${event.title} ↗`;
      agenda.append(link);
    });
    calendarPrevious.disabled = monthKey <= firstMonth;
  };
  calendarPrevious.addEventListener('click', () => {
    if (calendarPrevious.disabled) return;
    if (--displayedMonth < 0) { displayedMonth = 11; displayedYear--; }
    renderCalendar();
  });
  calendarNext.addEventListener('click', () => {
    if (++displayedMonth > 11) { displayedMonth = 0; displayedYear++; }
    renderCalendar();
  });
  calendarJump?.addEventListener('change', () => {
    if (!validMonth(calendarJump.value)) return;
    [displayedYear, monthNumber] = calendarJump.value.split('-').map(Number);
    displayedMonth = monthNumber - 1; renderCalendar();
  });
  renderCalendar();
}

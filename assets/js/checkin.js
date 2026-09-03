const roster = window.AMERICALYS_ROSTER;
const storageKey = window.AMERICALYS_STORAGE_KEY;
const state = { family: null, section: null, member: null };

const familyMeta = {
  Strings: { icon: "𝄞", copy: "Violin, viola, cello & bass" },
  Winds: { icon: "◌", copy: "Woodwinds & brass" },
  Percussion: { icon: "◉", copy: "Percussion, drums & piano" }
};

const familyGrid = document.querySelector("#family-grid");
const sectionGrid = document.querySelector("#section-grid");
const memberList = document.querySelector("#member-list");
const nameSearch = document.querySelector("#name-search");

function showStep(step) {
  document.querySelectorAll(".flow-step").forEach((panel) => panel.classList.toggle("active", Number(panel.dataset.step) === step));
  document.querySelectorAll("#progress-list li").forEach((item, index) => {
    item.classList.toggle("active", index + 1 === step);
    item.classList.toggle("complete", index + 1 < step);
  });
  document.querySelector(".flow-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function familyCount(family) { return roster.filter((member) => member.family === family).length; }

Object.entries(familyMeta).forEach(([family, meta]) => {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "family-choice";
  button.innerHTML = `<span class="family-icon">${meta.icon}</span><strong>${family}</strong><small>${meta.copy}</small><em>${familyCount(family)} members</em>`;
  button.addEventListener("click", () => { state.family = family; state.section = null; state.member = null; renderSections(); showStep(2); });
  familyGrid.append(button);
});

function renderSections() {
  document.querySelector("#section-help").textContent = `${state.family} · ${familyCount(state.family)} members`;
  let sections = [...new Set(roster.filter((member) => member.family === state.family).map((member) => member.section))].sort();
  if (state.family === "Strings") sections = ["Violin", ...sections.filter((section) => !section.startsWith("Violin"))];
  sectionGrid.replaceChildren();
  sections.forEach((section) => {
    const count = roster.filter((member) => member.family === state.family && (section === "Violin" ? member.section.startsWith("Violin") : member.section === section)).length;
    const button = document.createElement("button"); button.type = "button"; button.className = "section-choice";
    button.innerHTML = `<span>${section}</span><small>${section === "Violin" ? "Violin 1 & Violin 2" : `${count} ${count === 1 ? "member" : "members"}`}</small><b aria-hidden="true">→</b>`;
    button.addEventListener("click", () => {
      if (section === "Violin") { renderViolinSections(); return; }
      chooseSection(section);
    });
    sectionGrid.append(button);
  });
}

function chooseSection(section) {
  state.section = section; state.member = null; nameSearch.value = ""; renderMembers(); showStep(3);
}

function renderViolinSections() {
  document.querySelector("#section-help").textContent = "Strings · Violin · Choose your part";
  sectionGrid.replaceChildren();
  const back = document.createElement("button"); back.type = "button"; back.className = "section-group-back"; back.textContent = "← All string sections"; back.addEventListener("click", renderSections); sectionGrid.append(back);
  ["Violin 1", "Violin 2"].forEach((section) => {
    const count = roster.filter((member) => member.section === section).length;
    const button = document.createElement("button"); button.type = "button"; button.className = "section-choice";
    button.innerHTML = `<span>${section}</span><small>${count} ${count === 1 ? "member" : "members"}</small><b aria-hidden="true">→</b>`;
    button.addEventListener("click", () => chooseSection(section)); sectionGrid.append(button);
  });
}

function editDistance(a, b) {
  const rows = Array.from({ length: a.length + 1 }, (_, index) => [index]);
  rows[0] = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    for (let j = 1; j <= b.length; j += 1) {
      rows[i][j] = Math.min(rows[i - 1][j] + 1, rows[i][j - 1] + 1, rows[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
  }
  return rows[a.length][b.length];
}

function similarity(name, query) {
  const cleanName = name.toLowerCase().trim();
  const cleanQuery = query.toLowerCase().trim();
  const wholeScore = 1 - editDistance(cleanName, cleanQuery) / Math.max(cleanName.length, cleanQuery.length, 1);
  const wordScore = Math.max(...cleanName.split(/\s+/).map((word) => 1 - editDistance(word, cleanQuery) / Math.max(word.length, cleanQuery.length, 1)));
  return Math.max(wholeScore, wordScore);
}

function memberButton(member) {
  const button = document.createElement("button"); button.type = "button"; button.className = "member-choice";
  const initials = member.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("");
  button.innerHTML = `<span class="member-avatar">${initials}</span><span><strong>${member.name}</strong><small>${member.section}</small></span><b aria-hidden="true">→</b>`;
  button.addEventListener("click", () => { state.member = member; prepareFinalStep(); showStep(4); });
  return button;
}

async function apiPost(body) {
  if (!window.AMERICALYS_ATTENDANCE_API) throw new Error("Attendance sync has not been configured yet.");
  let lastError;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), attempt === 0 ? 9000 : 15000);
    try {
      const response = await fetch(window.AMERICALYS_ATTENDANCE_API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body), signal: controller.signal });
      const text = await response.text();
      try { return JSON.parse(text); }
      catch { throw new Error("The check-in service needs to be updated. Please try again shortly."); }
    } catch (error) {
      lastError = error;
      if (error.name !== "AbortError" || attempt === 1) break;
    } finally { clearTimeout(timeout); }
  }
  if (lastError?.name === "AbortError") throw new Error("The attendance service is temporarily unavailable. Please try again in a moment.");
  throw lastError;
}

function warmAttendanceService() {
  if (!window.AMERICALYS_ATTENDANCE_API) return;
  fetch(`${window.AMERICALYS_ATTENDANCE_API}?action=health&t=${Date.now()}`, { mode: "no-cors", cache: "no-store" }).catch(() => {});
}

function renderMembers(query = "") {
  document.querySelector("#name-help").textContent = `${state.family} · ${state.section}`;
  const sectionMembers = roster.filter((member) => member.family === state.family && member.section === state.section);
  const cleanQuery = query.trim().toLowerCase();
  const matches = sectionMembers.filter((member) => member.name.toLowerCase().includes(cleanQuery));
  memberList.replaceChildren();
  matches.forEach((member) => memberList.append(memberButton(member)));
  if (!matches.length && cleanQuery.length >= 2) {
    const suggestions = sectionMembers.map((member) => ({ member, score: similarity(member.name, cleanQuery) })).filter((item) => item.score >= 0.34).sort((a, b) => b.score - a.score).slice(0, 4);
    if (suggestions.length) {
      const heading = document.createElement("p"); heading.className = "suggestion-heading"; heading.textContent = "No exact match. Did you mean?"; memberList.append(heading);
      suggestions.forEach(({ member }) => memberList.append(memberButton(member)));
    } else {
      memberList.innerHTML = `<p class="no-results">No close match found in ${state.section}. Check the spelling or go back to choose another section.</p>`;
    }
  }
}

nameSearch.addEventListener("input", () => renderMembers(nameSearch.value));
document.querySelectorAll("[data-back]").forEach((button) => button.addEventListener("click", () => showStep(Number(button.dataset.back))));

function getSaturdays(year) {
  const dates = []; const date = new Date(year, 0, 1);
  while (date.getDay() !== 6) date.setDate(date.getDate() + 1);
  while (date.getFullYear() === year) { dates.push(new Date(date)); date.setDate(date.getDate() + 7); }
  return dates;
}

function localISO(date) { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`; }
function displayDate(value) { return new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00`)); }

function populateDates() {
  const select = document.querySelector("#rehearsal-date"); const now = new Date();
  const dates = [...getSaturdays(now.getFullYear()), ...getSaturdays(now.getFullYear() + 1)];
  const nearest = [...dates].sort((a, b) => Math.abs(a - now) - Math.abs(b - now))[0];
  select.replaceChildren();
  dates.forEach((date) => { const option = document.createElement("option"); option.value = localISO(date); option.textContent = displayDate(option.value); option.selected = date.getTime() === nearest.getTime(); select.append(option); });
}

function prepareFinalStep() {
  document.querySelector("#member-summary").innerHTML = `<span class="summary-check">✓</span><div><strong>${state.member.name}</strong><small>${state.member.family} · ${state.member.section}</small></div><button type="button" id="change-member">Change</button>`;
  document.querySelector("#change-member").addEventListener("click", () => showStep(3));
}

document.querySelector("#member-code-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const feedback = document.querySelector("#member-code-feedback");
  const memberPin = document.querySelector("#member-pin").value.trim();
  const button = event.submitter;
  button.disabled = true; feedback.classList.remove("success"); feedback.textContent = "Checking member code…";
  try {
    const result = await apiPost({ action: "verifyMember", memberId: state.member.id, memberPin });
    if (!result.ok) throw new Error(result.error || "Invalid member code. Please try again.");
    feedback.classList.add("success"); feedback.textContent = "Member code accepted.";
    document.querySelector("#verified-member-summary").innerHTML = `<span class="summary-check">✓</span><div><strong>${state.member.name}</strong><small>${state.member.family} · ${state.member.section}</small></div>`;
    showStep(5);
  } catch (error) {
    feedback.textContent = error.message === "Incorrect member PIN" ? "Invalid member code. Please try again." : error.message;
    document.querySelector("#member-pin").select();
  } finally { button.disabled = false; button.innerHTML = `Verify member code <span aria-hidden="true">→</span>`; }
});

document.querySelector("#checkin-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const date = document.querySelector("#rehearsal-date").value;
  const code = document.querySelector("#rehearsal-code").value.trim().toUpperCase();
  const memberPin = document.querySelector("#member-pin").value.trim();
  const feedback = document.querySelector("#practice-code-feedback");
  const submitButton = event.submitter; submitButton.disabled = true; submitButton.textContent = "Checking practice code…"; feedback.textContent = "";
  const submission = { action: "checkIn", memberId: state.member.id, name: state.member.name, family: state.member.family, section: state.member.section, date, code, memberPin };
  try {
    const result = await apiPost(submission);
    if (!result.ok) throw new Error(result.error || "Check-in was not approved");
    document.querySelector("#status-title").textContent = "You’re checked in.";
    document.querySelector("#status-message").textContent = "Your code was accepted and your attendance was automatically approved.";
    document.querySelector("#receipt").innerHTML = `<div><span>Member</span><strong>${submission.name}</strong></div><div><span>Section</span><strong>${submission.section}</strong></div><div><span>Rehearsal</span><strong>${displayDate(submission.date)}</strong></div><div><span>Status</span><strong class="approved-text">Approved</strong></div>`;
    showStep(6);
  } catch (error) {
    feedback.textContent = error.message === "Incorrect rehearsal code" ? "Invalid practice code. Please try again." : error.message;
    document.querySelector("#rehearsal-code").select();
  } finally {
    submitButton.disabled = false; submitButton.innerHTML = `Submit check-in <span aria-hidden="true">→</span>`;
  }
});

document.querySelector("#new-checkin").addEventListener("click", () => { state.family = null; state.section = null; state.member = null; document.querySelector("#member-code-form").reset(); document.querySelector("#checkin-form").reset(); document.querySelectorAll(".form-feedback").forEach((item) => item.textContent = ""); showStep(1); });
populateDates();
warmAttendanceService();

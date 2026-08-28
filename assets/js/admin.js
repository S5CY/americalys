const tableBody = document.querySelector("#attendance-body");
const emptyState = document.querySelector("#empty-state");
const endpoint = window.AMERICALYS_ATTENDANCE_API;
let statusFilter = "all";
let rows = [];

function dateLabel(value) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${String(value).slice(0, 10)}T12:00:00`)); }
function timeLabel(value) { return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(value)); }
function adminKey() { return document.querySelector("#admin-key").value.trim(); }

document.querySelector("#admin-today").textContent = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
document.querySelector("#metric-roster").textContent = window.AMERICALYS_ROSTER.length;
document.querySelector("#admin-key").value = sessionStorage.getItem("americalys-admin-key") || "";

async function apiPost(body) {
  if (!endpoint) throw new Error("Google Sheets endpoint is not configured.");
  const response = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ ...body, adminKey: adminKey() }) });
  return response.json();
}

function populateDates() {
  const select = document.querySelector("#admin-date-filter"); const selected = select.value;
  const dates = [...new Set(rows.map((row) => String(row.Date).slice(0, 10)))].sort().reverse();
  select.innerHTML = `<option value="all">All dates</option>` + dates.map((date) => `<option value="${date}">${dateLabel(date)}</option>`).join("");
  if (["all", ...dates].includes(selected)) select.value = selected;
}

function render() {
  populateDates();
  const normalized = rows.map((row) => ({ ...row, status: String(row.Status || "").toLowerCase(), date: String(row.Date).slice(0, 10) }));
  ["pending", "approved", "rejected"].forEach((status) => { document.querySelector(`#metric-${status}`).textContent = normalized.filter((row) => row.status === status).length; });
  const dateFilter = document.querySelector("#admin-date-filter").value;
  const visible = normalized.filter((row) => (statusFilter === "all" || row.status === statusFilter) && (dateFilter === "all" || row.date === dateFilter));
  tableBody.replaceChildren(); emptyState.hidden = visible.length > 0;
  visible.forEach((row) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td><strong>${row.Name}</strong><small>${timeLabel(row["Submitted At"])}</small></td><td>${row.Family}<small>${row.Section}</small></td><td>${dateLabel(row.date)}</td><td><code>Verified</code></td><td><span class="status-pill ${row.status}">${row.Status}</span></td><td><small>Automatic</small></td>`;
    tableBody.append(tr);
  });
}

async function loadData() {
  const note = document.querySelector("#connection-note");
  if (!endpoint) { note.innerHTML = `<strong>Setup required:</strong> deploy the included Google Apps Script and paste its endpoint into <code>assets/js/attendance-config.js</code>.`; render(); return; }
  if (!adminKey()) { note.innerHTML = `<strong>Admin key required:</strong> enter it above, then save or refresh.`; return; }
  try {
    sessionStorage.setItem("americalys-admin-key", adminKey());
    const data = await apiPost({ action: "adminData" }); if (!data.ok) throw new Error(data.error);
    rows = data.attendance || []; note.textContent = `Connected to Google Sheets · ${rows.length} attendance records`;
    render();
  } catch (error) { note.innerHTML = `<strong>Connection error:</strong> ${error.message}`; }
}

document.querySelector("#session-form").addEventListener("submit", async (event) => {
  event.preventDefault(); const feedback = document.querySelector("#session-feedback"); const button = event.submitter;
  button.disabled = true; feedback.textContent = "Saving session…";
  try {
    sessionStorage.setItem("americalys-admin-key", adminKey());
    const data = await apiPost({ action: "saveSession", date: document.querySelector("#session-date").value, code: document.querySelector("#session-code").value, opensAt: new Date(document.querySelector("#session-opens").value).toISOString(), closesAt: new Date(document.querySelector("#session-closes").value).toISOString() });
    if (!data.ok) throw new Error(data.error); feedback.textContent = "Session saved. Correct codes during this window will auto-approve."; await loadData();
  } catch (error) { feedback.textContent = error.message; }
  finally { button.disabled = false; }
});

document.querySelector("#status-tabs").addEventListener("click", (event) => { const button = event.target.closest("button"); if (!button) return; statusFilter = button.dataset.filter; document.querySelectorAll("#status-tabs button").forEach((item) => item.classList.toggle("active", item === button)); render(); });
document.querySelector("#admin-date-filter").addEventListener("change", render);
document.querySelector("#admin-key").addEventListener("change", loadData);
loadData();

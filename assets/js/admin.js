const storageKey = window.AMERICALYS_STORAGE_KEY;
const tableBody = document.querySelector("#attendance-body");
const emptyState = document.querySelector("#empty-state");
let statusFilter = "all";

function submissions() { return JSON.parse(localStorage.getItem(storageKey) || "[]"); }
function save(rows) { localStorage.setItem(storageKey, JSON.stringify(rows)); }
function dateLabel(value) { return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(`${value}T12:00:00`)); }
function timeLabel(value) { return new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit" }).format(new Date(value)); }

document.querySelector("#admin-today").textContent = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
document.querySelector("#metric-roster").textContent = window.AMERICALYS_ROSTER.length;

function updateStatus(id, status) {
  const rows = submissions(); const row = rows.find((entry) => entry.id === id);
  if (row) { row.status = status; row.reviewedAt = new Date().toISOString(); save(rows); render(); }
}

function populateDates(rows) {
  const select = document.querySelector("#admin-date-filter"); const selected = select.value;
  const dates = [...new Set(rows.map((row) => row.date))].sort().reverse();
  select.innerHTML = `<option value="all">All dates</option>` + dates.map((date) => `<option value="${date}">${dateLabel(date)}</option>`).join("");
  if (["all", ...dates].includes(selected)) select.value = selected;
}

function render() {
  const rows = submissions(); populateDates(rows);
  ["pending", "approved", "rejected"].forEach((status) => { document.querySelector(`#metric-${status}`).textContent = rows.filter((row) => row.status === status).length; });
  const dateFilter = document.querySelector("#admin-date-filter").value;
  const visible = rows.filter((row) => (statusFilter === "all" || row.status === statusFilter) && (dateFilter === "all" || row.date === dateFilter));
  tableBody.replaceChildren(); emptyState.hidden = visible.length > 0;
  visible.forEach((row) => {
    const tr = document.createElement("tr");
    const actions = row.status === "pending" ? `<button class="approve-button" data-id="${row.id}" data-status="approved">Approve</button><button class="reject-button" data-id="${row.id}" data-status="rejected">Reject</button>` : `<button class="reset-button" data-id="${row.id}" data-status="pending">Reset</button>`;
    tr.innerHTML = `<td><strong>${row.name}</strong><small>${timeLabel(row.submittedAt)}</small></td><td>${row.family}<small>${row.section}</small></td><td>${dateLabel(row.date)}</td><td><code>${row.code}</code></td><td><span class="status-pill ${row.status}">${row.status === "pending" ? "Waiting" : row.status}</span></td><td><div class="review-actions">${actions}</div></td>`;
    tableBody.append(tr);
  });
  tableBody.querySelectorAll("[data-status]").forEach((button) => button.addEventListener("click", () => updateStatus(button.dataset.id, button.dataset.status)));
}

document.querySelector("#status-tabs").addEventListener("click", (event) => { const button = event.target.closest("button"); if (!button) return; statusFilter = button.dataset.filter; document.querySelectorAll("#status-tabs button").forEach((item) => item.classList.toggle("active", item === button)); render(); });
document.querySelector("#admin-date-filter").addEventListener("change", render);
window.addEventListener("storage", render);
render();

(() => {
  const roster = window.AMERICALYS_ROSTER || [];
  const nav = document.querySelector("#member-section-nav");
  const grid = document.querySelector("#member-card-grid");
  if (!nav || !grid) return;
  const title = document.querySelector("#member-section-title");
  const familyLabel = document.querySelector("#member-family-label");
  const count = document.querySelector("#member-section-count");
  document.querySelector("#directory-total").textContent = `${roster.length} musicians`;
  const familyOrder = ["Strings", "Winds", "Percussion"];

  function renderCards(members, label, family = "Full orchestra") {
    title.textContent = label; familyLabel.textContent = family; count.textContent = `${members.length} ${members.length === 1 ? "member" : "members"}`;
    grid.replaceChildren();
    members.forEach((member, index) => {
      const card = document.createElement("article"); card.className = "member-card";
      const initials = member.name.split(/\s+/).map(part => part[0]).slice(0, 2).join("");
      card.innerHTML = `<div class="member-photo-placeholder"><span class="member-initials">${initials}</span><small>${String(index + 1).padStart(2, "0")}</small></div><div class="member-card-copy"><h3>${member.name}</h3><p>${member.section}</p><small>Years with AmeriCal <b>—</b></small></div>`;
      grid.append(card);
    });
    document.querySelectorAll(".member-section-button").forEach(button => button.classList.toggle("active", button.dataset.label === label));
    document.querySelector(".member-results").scrollTop = 0;
  }

  function addButton(label, family, members) {
    const button = document.createElement("button"); button.type = "button"; button.className = "member-section-button"; button.dataset.label = label;
    button.innerHTML = `<span>${label}</span><small>${members.length}</small>`;
    button.addEventListener("click", () => renderCards(members, label, family)); nav.append(button);
  }

  addButton("All musicians", "Full orchestra", roster);
  familyOrder.forEach(family => {
    const heading = document.createElement("p"); heading.className = "member-family-heading"; heading.textContent = family; nav.append(heading);
    const sections = [...new Set(roster.filter(member => member.family === family).map(member => member.section))].sort((a, b) => a.localeCompare(b, undefined, {numeric:true}));
    sections.forEach(section => addButton(section, family, roster.filter(member => member.section === section)));
  });
  renderCards(roster, "All musicians");
})();

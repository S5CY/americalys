const milestones = [...document.querySelectorAll('.milestone')];
const hoverDevice = window.matchMedia('(hover: hover) and (pointer: fine)');
milestones.forEach((item) => {
  const summary = item.querySelector('summary');
  let hoverOpened = false;
  let pinned = false;
  let timer;
  item.addEventListener('pointerenter', () => {
    if (!hoverDevice.matches || item.open) return;
    timer = setTimeout(() => { item.open = true; hoverOpened = true; }, 220);
  });
  item.addEventListener('pointerleave', () => {
    clearTimeout(timer);
    if (hoverOpened && !pinned && !item.contains(document.activeElement)) item.open = false;
    hoverOpened = false;
  });
  summary.addEventListener('click', (event) => {
    clearTimeout(timer);
    if (hoverOpened && !pinned) {
      event.preventDefault(); pinned = true; hoverOpened = false;
    } else pinned = !item.open;
  });
});
function openLinkedMilestone() {
  const id = decodeURIComponent(location.hash.slice(1));
  const item = document.getElementById(id);
  if (!item?.classList.contains('milestone')) return;
  item.open = true;
  requestAnimationFrame(() => item.scrollIntoView({ block: 'start' }));
}
window.addEventListener('hashchange', openLinkedMilestone);
openLinkedMilestone();

const photoDialog = document.querySelector('.photo-dialog');
if (photoDialog && typeof photoDialog.showModal === 'function') {
  const photo = photoDialog.querySelector('img');
  let trigger;
  document.querySelectorAll('.gallery-image').forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault(); trigger = link;
      photo.src = link.href;
      photo.alt = link.querySelector('img').alt;
      photoDialog.querySelector('p').textContent = photo.alt;
      photoDialog.showModal();
    });
  });
  photoDialog.querySelector('button').addEventListener('click', () => photoDialog.close());
  photoDialog.addEventListener('click', (event) => { if (event.target === photoDialog) photoDialog.close(); });
  photoDialog.addEventListener('close', () => trigger?.focus());
}

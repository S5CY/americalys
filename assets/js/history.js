const milestones = [...document.querySelectorAll('.milestone')];
const hoverDevice = window.matchMedia('(hover: hover) and (pointer: fine)');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const galleryControls = new Map();
milestones.forEach((item) => {
  const summary = item.querySelector('summary');
  let hoverOpened = false;
  let pinned = false;
  let timer;
  let animation;
  let expanded = item.open;
  const setExpanded = (open, immediate = false) => {
    const startHeight = item.getBoundingClientRect().height;
    animation?.cancel();
    animation = null;
    expanded = open;
    item.style.height = '';
    item.style.overflow = '';
    if (immediate || reducedMotion.matches) {
      item.open = open;
      return;
    }
    // Keep native details open during the animation; close only after collapsing.
    item.open = true;
    const endHeight = open
      ? item.getBoundingClientRect().height
      : summary.getBoundingClientRect().height +
        parseFloat(getComputedStyle(item).borderTopWidth) +
        parseFloat(getComputedStyle(item).borderBottomWidth);
    item.style.overflow = 'hidden';
    // Long photo galleries need more travel time than short accordion panels.
    // Ease in as well as out, rather than revealing most of the gallery at once.
    const duration = Math.min(1200, Math.max(700, Math.abs(endHeight - startHeight) * .45));
    animation = item.animate(
      [{ height: startHeight + 'px' }, { height: endHeight + 'px' }],
      { duration, easing: 'cubic-bezier(.45, 0, .25, 1)', fill: 'both' }
    );
    animation.onfinish = () => {
      item.open = open;
      animation.cancel();
      animation = null;
      item.style.overflow = '';
    };
  };
  galleryControls.set(item, () => {
    clearTimeout(timer);
    hoverOpened = false;
    pinned = true;
    setExpanded(true, true);
  });
  item.addEventListener('pointerenter', () => {
    clearTimeout(timer);
    if (!hoverDevice.matches || expanded) return;
    timer = setTimeout(() => { hoverOpened = true; setExpanded(true); }, 260);
  });
  item.addEventListener('pointerleave', () => {
    clearTimeout(timer);
    if (hoverOpened && !pinned && !item.contains(document.activeElement)) {
      timer = setTimeout(() => { hoverOpened = false; setExpanded(false); }, 500);
    }
  });
  summary.addEventListener('click', (event) => {
    event.preventDefault();
    clearTimeout(timer);
    if (hoverOpened && !pinned) {
      pinned = true; hoverOpened = false;
    } else {
      pinned = !expanded;
      hoverOpened = false;
      setExpanded(!expanded);
    }
  });
});
function openLinkedMilestone() {
  const id = decodeURIComponent(location.hash.slice(1));
  const item = document.getElementById(id);
  if (!item?.classList.contains('milestone')) return;
  galleryControls.get(item)?.();
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

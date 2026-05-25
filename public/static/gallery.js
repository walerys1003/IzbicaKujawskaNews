document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const trigger = target.closest('[data-gallery-open]');
  if (!trigger) return;
  event.preventDefault();
  const href = trigger.getAttribute('href');
  if (!href) return;
  const overlay = document.createElement('div');
  overlay.className = 'gallery-overlay';
  overlay.innerHTML = `<div class="gallery-overlay__inner"><button class="gallery-overlay__close">×</button><img src="${href}" alt="podgląd" /></div>`;
  overlay.addEventListener('click', () => overlay.remove());
  document.body.appendChild(overlay);
});

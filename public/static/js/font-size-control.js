(() => {
  if (window.__izbicaFontSizeControl) return;
  window.__izbicaFontSizeControl = true;
  const STORAGE_KEY = 'izbica24:font-scale';

  const boot = () => {
    const article = document.querySelector('.article-page');
    const body = document.querySelector('.article-body');
    const actions = document.querySelector('.byline-actions');
    if (!article || !body || !actions || actions.querySelector('.font-size-controls')) return;

    const saved = localStorage.getItem(STORAGE_KEY) || '1';
    body.style.fontSize = 'calc(1rem * ' + saved + ')';

    const wrap = document.createElement('div');
    wrap.className = 'font-size-controls';
    wrap.style.cssText = 'display:flex;gap:6px;align-items:center;';
    wrap.innerHTML = '<button type="button" class="byline-btn" data-scale="0.95">A</button><button type="button" class="byline-btn" data-scale="1">A+</button><button type="button" class="byline-btn" data-scale="1.1">A++</button>';
    actions.appendChild(wrap);

    wrap.querySelectorAll('[data-scale]').forEach((button) => {
      button.addEventListener('click', () => {
        const scale = button.dataset.scale || '1';
        body.style.fontSize = 'calc(1rem * ' + scale + ')';
        localStorage.setItem(STORAGE_KEY, scale);
      });
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();


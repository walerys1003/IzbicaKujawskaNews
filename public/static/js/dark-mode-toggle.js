(() => {
  if (window.__izbicaDarkMode) return;
  window.__izbicaDarkMode = true;
  const STORAGE_KEY = 'izbica24:theme';

  const applyTheme = (theme) => {
    const effective = theme === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : theme;
    document.documentElement.dataset.theme = effective;
  };

  const injectStyles = () => {
    if (document.getElementById('izbica-dark-mode-style')) return;
    const style = document.createElement('style');
    style.id = 'izbica-dark-mode-style';
    style.textContent = `
      html[data-theme="dark"] body { background:#071321; color:#e2e8f0; }
      html[data-theme="dark"] .v3-module, html[data-theme="dark"] .cat-card, html[data-theme="dark"] .search-result a, html[data-theme="dark"] .article-author-card, html[data-theme="dark"] .article-comments, html[data-theme="dark"] .search-autocomplete-results { background:#0f172a !important; color:#e2e8f0 !important; }
      html[data-theme="dark"] .v3-module-title, html[data-theme="dark"] .article-title, html[data-theme="dark"] .cat-title, html[data-theme="dark"] .search-title { color:#f8fafc !important; }
      html[data-theme="dark"] a { color:#f8fafc; }
      .theme-toggle-btn { border:1px solid rgba(255,255,255,.18); background:rgba(255,255,255,.08); color:inherit; border-radius:999px; padding:6px 12px; font:700 12px/1 Inter,sans-serif; cursor:pointer; }
    `;
    document.head.appendChild(style);
  };

  const boot = () => {
    injectStyles();
    const mount = document.querySelector('.nav-right') || document.querySelector('.sh-right') || document.body;
    if (!mount || document.querySelector('.theme-toggle-btn')) return;
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'theme-toggle-btn';
    button.textContent = '🌙 Tryb nocny';
    mount.appendChild(button);

    let theme = localStorage.getItem(STORAGE_KEY) || 'system';
    applyTheme(theme);
    button.textContent = document.documentElement.dataset.theme === 'dark' ? '☀️ Tryb jasny' : '🌙 Tryb nocny';

    button.addEventListener('click', () => {
      theme = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      localStorage.setItem(STORAGE_KEY, theme);
      applyTheme(theme);
      button.textContent = document.documentElement.dataset.theme === 'dark' ? '☀️ Tryb jasny' : '🌙 Tryb nocny';
    });

    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      if ((localStorage.getItem(STORAGE_KEY) || 'system') === 'system') applyTheme('system');
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();


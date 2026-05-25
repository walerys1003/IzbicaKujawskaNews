(() => {
  if (window.__izbicaReadProgress) return;
  window.__izbicaReadProgress = true;

  const boot = () => {
    const article = document.querySelector('.article-page');
    const body = document.querySelector('.article-body');
    if (!article || !body) return;
    const bar = document.createElement('div');
    bar.className = 'read-progress-bar';
    bar.style.cssText = 'position:fixed;top:0;left:0;height:4px;width:0;background:linear-gradient(90deg,#8b1d2a,#c8a951);z-index:1200;transition:width .1s linear;';
    document.body.appendChild(bar);

    const update = () => {
      const rect = body.getBoundingClientRect();
      const total = body.scrollHeight - window.innerHeight;
      const scrolled = Math.min(Math.max(window.scrollY - (window.scrollY + rect.top), 0), total);
      const progress = total > 0 ? (scrolled / total) * 100 : 0;
      bar.style.width = Math.min(Math.max(progress, 0), 100) + '%';
    };

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();


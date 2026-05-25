(() => {
  if (window.__izbicaScrollTop) return;
  window.__izbicaScrollTop = true;

  const boot = () => {
    let button = document.getElementById('scrollTopBtn');
    if (!button) {
      button = document.createElement('button');
      button.id = 'scrollTopBtn';
      button.type = 'button';
      button.textContent = '↑';
      button.style.cssText = 'position:fixed;right:20px;bottom:20px;width:44px;height:44px;border:0;border-radius:999px;background:#8b1d2a;color:#fff;box-shadow:0 12px 30px rgba(15,23,42,.22);cursor:pointer;opacity:0;pointer-events:none;transition:opacity .2s ease;z-index:900;';
      document.body.appendChild(button);
    }

    const toggle = (visible) => {
      button.style.opacity = visible ? '1' : '0';
      button.style.pointerEvents = visible ? 'auto' : 'none';
    };

    button.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

    if ('IntersectionObserver' in window) {
      const marker = document.createElement('div');
      marker.style.cssText = 'position:absolute;top:600px;height:1px;width:1px;pointer-events:none;';
      document.body.prepend(marker);
      const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => toggle(!entry.isIntersecting));
      });
      observer.observe(marker);
    } else {
      window.addEventListener('scroll', () => toggle(window.scrollY > 600), { passive: true });
    }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();


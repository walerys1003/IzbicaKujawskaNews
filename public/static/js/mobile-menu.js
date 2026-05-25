(() => {
  if (window.__izbicaMobileMenu) return;
  window.__izbicaMobileMenu = true;

  const trapFocus = (container, event) => {
    if (event.key !== 'Tab') return;
    const focusable = Array.from(container.querySelectorAll('a, button, input, [tabindex]:not([tabindex="-1"])'));
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const boot = () => {
    const hamburger = document.getElementById('hamburger');
    const menu = document.getElementById('mainMenu');
    if (!hamburger || !menu) return;
    let touchStartX = 0;

    const close = () => {
      menu.classList.remove('is-open');
      hamburger.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('menu-open');
    };
    const open = () => {
      menu.classList.add('is-open');
      hamburger.setAttribute('aria-expanded', 'true');
      document.body.classList.add('menu-open');
      const firstLink = menu.querySelector('a');
      firstLink && firstLink.focus();
    };

    if (!document.getElementById('mobile-menu-style')) {
      const style = document.createElement('style');
      style.id = 'mobile-menu-style';
      style.textContent = '@media (max-width: 980px){ #mainMenu{position:fixed;inset:0 auto 0 0;width:min(86vw,360px);background:#0a2540;padding:24px;transform:translateX(-102%);transition:transform .22s ease;z-index:1000;overflow:auto;} #mainMenu.is-open{transform:translateX(0);} body.menu-open{overflow:hidden;} #mainMenu a{color:#fff !important;} }';
      document.head.appendChild(style);
    }

    hamburger.addEventListener('click', () => {
      if (menu.classList.contains('is-open')) close();
      else open();
    });
    document.addEventListener('keydown', (event) => {
      if (!menu.classList.contains('is-open')) return;
      if (event.key === 'Escape') close();
      trapFocus(menu, event);
    });
    menu.addEventListener('touchstart', (event) => {
      touchStartX = event.changedTouches[0].clientX;
    }, { passive: true });
    menu.addEventListener('touchend', (event) => {
      const deltaX = event.changedTouches[0].clientX - touchStartX;
      if (deltaX < -60) close();
    }, { passive: true });
    document.addEventListener('click', (event) => {
      if (!menu.classList.contains('is-open')) return;
      if (menu.contains(event.target) || hamburger.contains(event.target)) return;
      close();
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();


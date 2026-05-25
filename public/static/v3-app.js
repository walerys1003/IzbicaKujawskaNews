/* ============================================================
   IZBICA24.PL v3 — "Magazyn Kujawski Premium"
   Frontend interaktywność: scroll-top, mobile menu, smooth scroll,
   keyboard shortcuts, lazy-load placeholders, dark mode toggle
   ============================================================ */

(function () {
  'use strict';

  // ============ READY ============
  function ready(fn) {
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // ============ SCROLL TOP BUTTON ============
  function initScrollTop() {
    const btn = document.getElementById('scrollTopBtn');
    if (!btn) return;

    const THRESHOLD = 400;
    let ticking = false;

    function update() {
      const y = window.scrollY || window.pageYOffset;
      if (y > THRESHOLD) {
        btn.classList.add('is-visible');
      } else {
        btn.classList.remove('is-visible');
      }
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) {
        window.requestAnimationFrame(update);
        ticking = true;
      }
    }, { passive: true });

    btn.addEventListener('click', function (e) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Initial check
    update();
  }

  // ============ MOBILE MENU TOGGLE ============
  function initMobileMenu() {
    const hamburger = document.querySelector('.v3-hamburger');
    const navList = document.querySelector('.v3-nav-list');
    const body = document.body;

    if (!hamburger || !navList) return;

    hamburger.addEventListener('click', function () {
      const isOpen = navList.classList.toggle('is-open');
      hamburger.classList.toggle('is-active', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      body.classList.toggle('v3-nav-open', isOpen);
    });

    // Zamknij po kliknięciu w link
    navList.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navList.classList.remove('is-open');
        hamburger.classList.remove('is-active');
        body.classList.remove('v3-nav-open');
      });
    });

    // Zamknij po kliknięciu poza menu
    document.addEventListener('click', function (e) {
      if (!navList.classList.contains('is-open')) return;
      if (navList.contains(e.target) || hamburger.contains(e.target)) return;
      navList.classList.remove('is-open');
      hamburger.classList.remove('is-active');
      body.classList.remove('v3-nav-open');
    });

    // ESC zamyka menu
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navList.classList.contains('is-open')) {
        navList.classList.remove('is-open');
        hamburger.classList.remove('is-active');
        body.classList.remove('v3-nav-open');
        hamburger.focus();
      }
    });
  }

  // ============ SMOOTH SCROLL DLA ANCHORÓW ============
  function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        const id = a.getAttribute('href');
        if (!id || id === '#') return;
        const target = document.querySelector(id);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.scrollY - 80;
        window.scrollTo({ top: top, behavior: 'smooth' });
      });
    });
  }

  // ============ KEYBOARD SHORTCUTS ============
  function initKeyboard() {
    document.addEventListener('keydown', function (e) {
      // Cmd/Ctrl + K — szukaj
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"], .v3-search-input');
        if (searchInput) {
          searchInput.focus();
          searchInput.select && searchInput.select();
        } else {
          window.location.href = '/szukaj';
        }
      }
      // / — szybkie szukanie (jak GitHub)
      if (e.key === '/' && !e.metaKey && !e.ctrlKey && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"], .v3-search-input');
        if (searchInput) {
          searchInput.focus();
        } else {
          window.location.href = '/szukaj';
        }
      }
    });
  }

  // ============ DARK MODE TOGGLE ============
  function initDarkMode() {
    const btn = document.querySelector('[data-theme-toggle]');
    const root = document.documentElement;

    // Wczytaj zapisaną preferencję
    const saved = localStorage.getItem('izb24-theme');
    if (saved === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (saved === 'light') {
      root.setAttribute('data-theme', 'light');
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      root.setAttribute('data-theme', 'dark');
    }

    if (!btn) return;
    btn.addEventListener('click', function () {
      const cur = root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      const next = cur === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('izb24-theme', next);
    });
  }

  // ============ BREAKING TICKER PAUZA NA HOVER ============
  function initTicker() {
    const ticker = document.querySelector('.v3-breaking-track, .v3-ticker-track');
    if (!ticker) return;
    ticker.addEventListener('mouseenter', function () {
      ticker.style.animationPlayState = 'paused';
    });
    ticker.addEventListener('mouseleave', function () {
      ticker.style.animationPlayState = 'running';
    });
  }

  // ============ LAZY LOAD PLACEHOLDERS (subtelna animacja) ============
  function initLazyPlaceholders() {
    if (!('IntersectionObserver' in window)) return;
    const items = document.querySelectorAll('.v3-img-placeholder, [data-lazy]');
    const io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-loaded');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '50px' });
    items.forEach(function (el) { io.observe(el); });
  }

  // ============ AKTUALIZACJA ZEGARA W UTILITY BAR (opcjonalnie) ============
  function initClock() {
    const el = document.querySelector('[data-clock]');
    if (!el) return;
    function tick() {
      const now = new Date();
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      el.textContent = hh + ':' + mm;
    }
    tick();
    setInterval(tick, 30000);
  }

  // ============ MEGA-MENU NA TOUCH (otwórz na tap) ============
  function initMegaMenu() {
    const isTouch = window.matchMedia('(hover: none)').matches;
    if (!isTouch) return;
    document.querySelectorAll('.v3-nav-item-has-mega > a, .v3-nav-item-has-mega > button').forEach(function (trigger) {
      trigger.addEventListener('click', function (e) {
        const parent = trigger.parentElement;
        if (!parent) return;
        const wasOpen = parent.classList.contains('is-mega-open');
        document.querySelectorAll('.v3-nav-item-has-mega.is-mega-open').forEach(function (n) {
          n.classList.remove('is-mega-open');
        });
        if (!wasOpen) {
          e.preventDefault();
          parent.classList.add('is-mega-open');
        }
      });
    });
  }

  // ============ INIT ALL ============
  ready(function () {
    try { initScrollTop(); } catch (e) { console.warn('[v3] scrollTop:', e); }
    try { initMobileMenu(); } catch (e) { console.warn('[v3] mobileMenu:', e); }
    try { initSmoothScroll(); } catch (e) { console.warn('[v3] smoothScroll:', e); }
    try { initKeyboard(); } catch (e) { console.warn('[v3] keyboard:', e); }
    try { initDarkMode(); } catch (e) { console.warn('[v3] darkMode:', e); }
    try { initTicker(); } catch (e) { console.warn('[v3] ticker:', e); }
    try { initLazyPlaceholders(); } catch (e) { console.warn('[v3] lazy:', e); }
    try { initClock(); } catch (e) { console.warn('[v3] clock:', e); }
    try { initMegaMenu(); } catch (e) { console.warn('[v3] megaMenu:', e); }
    console.log('[izbica24 v3] "Magazyn Kujawski Premium" zainicjalizowany ✓');
  });
})();

/* ==========================================================================
   IZBICA24.PL v4 — SKRYPTY FRONTU
   Sekcja A: przeniesione literalnie z index.html (reveal, filtry, k-tabs, scroll)
   Sekcja B: mega-nav (podkategorie + rotujące karty), mobile menu
   Sekcja C: lightbox galerii, odtwarzacz audio, filtry list
   ========================================================================== */
(function () {
  'use strict';
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ═══════════════════════════════════════ A. SZATA — 1:1 z index.html
  // Reveal-on-scroll z 4 safety nets
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const viewportH = window.innerHeight;
    const toHide = [];
    document.querySelectorAll('.reveal').forEach((el) => {
      const rect = el.getBoundingClientRect();
      if (rect.top > viewportH * 0.85) toHide.push(el);
      else el.classList.add('visible');
    });
    if (toHide.length) {
      const obs = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add('visible');
              obs.unobserve(entry.target);
            }
          });
        },
        { threshold: 0.05, rootMargin: '0px 0px -60px 0px' }
      );
      toHide.forEach((el) => obs.observe(el));
      setTimeout(() => toHide.forEach((el) => el.classList.add('visible')), 3000);
    }
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
  }

  // Print guard
  window.addEventListener('beforeprint', () => {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'));
  });

  // News filters — filtrowanie kart wg data-cat
  document.querySelectorAll('.news-filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      const scope = btn.closest('.section') || document;
      scope.querySelectorAll('.news-filter').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      const grid = scope.querySelector('.news-grid');
      if (!grid) return;
      grid.querySelectorAll('[data-cat]').forEach((card) => {
        const show = filter === 'all' || card.dataset.cat === filter;
        card.style.display = show ? '' : 'none';
      });
    });
  });

  // MM filters — filtrowanie multimediów wg data-mmtype
  document.querySelectorAll('.mm-filter').forEach((btn) => {
    btn.addEventListener('click', () => {
      const scope = btn.closest('.section') || document;
      scope.querySelectorAll('.mm-filter').forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.mm;
      scope.querySelectorAll('[data-mmtype]').forEach((item) => {
        const show = filter === 'all' || item.dataset.mmtype === filter;
        item.style.display = show ? '' : 'none';
      });
    });
  });

  // Kujawianka tabs — przełączanie paneli
  document.querySelectorAll('.k-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.ktab;
      const container = tab.closest('.kujawianka');
      if (!container) return;
      container.querySelectorAll('.k-tab').forEach((t) => {
        t.classList.remove('active');
        t.setAttribute('aria-selected', 'false');
      });
      container.querySelectorAll('.k-panel').forEach((p) => p.classList.remove('active'));
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');
      const panel = container.querySelector('[data-kpanel="' + target + '"]');
      if (panel) panel.classList.add('active');
    });
  });

  // Smooth scroll dla linków wewnątrzstronowych
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const href = a.getAttribute('href');
      if (href === '#' || href.length <= 1) return;
      const target = document.querySelector(href);
      if (target) {
        e.preventDefault();
        const header = document.getElementById('main-header');
        const headerH = header ? header.offsetHeight : 0;
        const y = target.getBoundingClientRect().top + window.scrollY - headerH - 40;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });

  // ═══════════════════════════════════════ B. MEGA-NAV
  // B1. Przełączanie podkategorii w mega-panelu
  document.querySelectorAll('.mega-sub').forEach((btn) => {
    const activate = () => {
      const cat = btn.dataset.megaCat;
      const sub = btn.dataset.megaSub;
      const panel = btn.closest('.mega-panel');
      if (!panel) return;
      panel.querySelectorAll('.mega-sub').forEach((b) => b.classList.remove('active'));
      panel.querySelectorAll('.mega-slate').forEach((s) => s.classList.remove('active'));
      btn.classList.add('active');
      const slate = panel.querySelector('[data-mega-slate="' + sub + '"][data-mega-cat="' + cat + '"]');
      if (slate) {
        slate.classList.add('active');
        restartRotator(slate);
      }
    };
    btn.addEventListener('mouseenter', activate);
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      activate();
    });
    btn.addEventListener('focus', activate);
  });

  // B2. Rotator kart artykułów — automatyczna zmiana wyróżnionego materiału
  const rotators = new WeakMap();

  function buildRotator(slate) {
    const wrap = slate.querySelector('[data-rotator]');
    const dotsWrap = slate.querySelector('[data-rotator-dots]');
    if (!wrap) return null;
    const cards = Array.from(wrap.querySelectorAll('.mega-card'));
    const dots = dotsWrap ? Array.from(dotsWrap.querySelectorAll('.mega-dot')) : [];
    if (cards.length < 2) return null;

    let index = 0;
    let timer = null;

    function paint(i) {
      index = (i + cards.length) % cards.length;
      cards.forEach((c, ci) => {
        c.classList.toggle('rot-active', ci === index);
        // Karta aktywna staje się wiodącą (duża) — pozostałe standardowe
        c.classList.toggle('is-lead', ci === index);
        c.style.order = ci === index ? '-1' : String(ci);
      });
      dots.forEach((d, di) => d.classList.toggle('active', di === index));
    }

    function next() {
      paint(index + 1);
    }
    function start() {
      if (reduceMotion) return;
      stop();
      timer = setInterval(next, 4000);
    }
    function stop() {
      if (timer) clearInterval(timer);
      timer = null;
    }

    dots.forEach((d, di) =>
      d.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        paint(di);
        start();
      })
    );
    cards.forEach((c) => {
      c.addEventListener('mouseenter', stop);
      c.addEventListener('mouseleave', start);
    });

    paint(0);
    return { start, stop, paint };
  }

  function restartRotator(slate) {
    let r = rotators.get(slate);
    if (!r) {
      r = buildRotator(slate);
      if (r) rotators.set(slate, r);
    }
    if (r) r.start();
  }

  function stopAllRotators(panel) {
    panel.querySelectorAll('.mega-slate').forEach((s) => {
      const r = rotators.get(s);
      if (r) r.stop();
    });
  }

  // B3. Start/stop rotatorów przy najechaniu na pozycję menu
  document.querySelectorAll('.nav-item.has-mega').forEach((item) => {
    const panel = item.querySelector('.mega-panel');
    if (!panel) return;
    item.addEventListener('mouseenter', () => {
      const active = panel.querySelector('.mega-slate.active') || panel.querySelector('.mega-slate');
      if (active) {
        active.classList.add('active');
        restartRotator(active);
      }
    });
    item.addEventListener('mouseleave', () => stopAllRotators(panel));
    // Klawiatura: Enter otwiera panel
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        item.classList.remove('is-open');
        stopAllRotators(panel);
      }
    });
  });

  // B4. Menu mobilne
  const burger = document.querySelector('.nav-burger');
  const navBar = document.querySelector('.nav-bar');
  if (burger && navBar) {
    burger.addEventListener('click', () => {
      const open = navBar.classList.toggle('is-open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    // Na mobile: dotknięcie pozycji rozwija mega-panel zamiast nawigować
    navBar.querySelectorAll('.nav-item.has-mega').forEach((item) => {
      const chev = item.querySelector('.chev');
      if (!chev) return;
      chev.addEventListener('click', (e) => {
        if (window.innerWidth > 900) return;
        e.preventDefault();
        e.stopPropagation();
        const wasOpen = item.classList.contains('is-open');
        navBar.querySelectorAll('.nav-item.is-open').forEach((i) => i.classList.remove('is-open'));
        if (!wasOpen) item.classList.add('is-open');
      });
    });
  }

  // ═══════════════════════════════════════ C. GALERIA / LIGHTBOX
  const galItems = Array.from(document.querySelectorAll('.gal-item, .mm-thumb'));
  if (galItems.length) {
    const box = document.createElement('div');
    box.className = 'lightbox';
    box.innerHTML =
      '<span class="lightbox-count"></span>' +
      '<button class="lightbox-close" aria-label="Zamknij">×</button>' +
      '<button class="lightbox-prev" aria-label="Poprzednie">‹</button>' +
      '<img alt="">' +
      '<button class="lightbox-next" aria-label="Następne">›</button>' +
      '<div class="lightbox-cap"></div>';
    document.body.appendChild(box);

    const imgEl = box.querySelector('img');
    const capEl = box.querySelector('.lightbox-cap');
    const cntEl = box.querySelector('.lightbox-count');
    let current = 0;

    const sources = galItems.map((it) => {
      const im = it.querySelector('img');
      const cap = it.querySelector('figcaption');
      return {
        src: (im && (im.dataset.full || im.src)) || '',
        alt: (im && im.alt) || '',
        caption: cap ? cap.textContent.trim() : (im && im.alt) || '',
      };
    });

    function show(i) {
      current = (i + sources.length) % sources.length;
      const s = sources[current];
      imgEl.src = s.src;
      imgEl.alt = s.alt;
      capEl.textContent = s.caption;
      cntEl.textContent = current + 1 + ' / ' + sources.length;
      box.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function close() {
      box.classList.remove('open');
      document.body.style.overflow = '';
    }

    galItems.forEach((it, i) =>
      it.addEventListener('click', (e) => {
        e.preventDefault();
        show(i);
      })
    );
    box.querySelector('.lightbox-close').addEventListener('click', close);
    box.querySelector('.lightbox-prev').addEventListener('click', (e) => {
      e.stopPropagation();
      show(current - 1);
    });
    box.querySelector('.lightbox-next').addEventListener('click', (e) => {
      e.stopPropagation();
      show(current + 1);
    });
    box.addEventListener('click', (e) => {
      if (e.target === box) close();
    });
    document.addEventListener('keydown', (e) => {
      if (!box.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(current - 1);
      if (e.key === 'ArrowRight') show(current + 1);
    });
  }

  // ═══════════════════════════════════════ D. ODTWARZACZ AUDIO
  document.querySelectorAll('.art-audio').forEach((player) => {
    const audio = player.querySelector('audio');
    const btn = player.querySelector('.aa-play');
    const bar = player.querySelector('.aa-bar');
    const fill = player.querySelector('.aa-fill');
    const times = player.querySelectorAll('.aa-times span');
    if (!audio || !btn) return;

    const fmt = (s) => {
      if (!isFinite(s)) return '0:00';
      const m = Math.floor(s / 60);
      const r = Math.floor(s % 60);
      return m + ':' + String(r).padStart(2, '0');
    };

    btn.addEventListener('click', () => {
      if (audio.paused) {
        document.querySelectorAll('.art-audio audio').forEach((a) => {
          if (a !== audio) a.pause();
        });
        audio.play().catch(() => {});
      } else audio.pause();
    });
    const setIcon = () => {
      btn.innerHTML = audio.paused
        ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 3l14 9-14 9V3z"/></svg>'
        : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M6 4h4v16H6zM14 4h4v16h-4z"/></svg>';
    };
    audio.addEventListener('play', setIcon);
    audio.addEventListener('pause', setIcon);
    audio.addEventListener('timeupdate', () => {
      if (fill && audio.duration) fill.style.width = (audio.currentTime / audio.duration) * 100 + '%';
      if (times[0]) times[0].textContent = fmt(audio.currentTime);
      if (times[1]) times[1].textContent = fmt(audio.duration);
    });
    if (bar) {
      bar.addEventListener('click', (e) => {
        const rect = bar.getBoundingClientRect();
        if (audio.duration) audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
      });
    }
    setIcon();
  });

  // ═══════════════════════════════════════ E. PASEK NARZĘDZI ARTYKUŁU
  document.querySelectorAll('[data-share]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const url = window.location.href;
      const title = document.title;
      if (navigator.share) {
        try {
          await navigator.share({ title, url });
          return;
        } catch (_) {}
      }
      try {
        await navigator.clipboard.writeText(url);
        btn.textContent = 'Skopiowano link';
        setTimeout(() => (btn.textContent = 'Udostępnij'), 2000);
      } catch (_) {}
    });
  });
  document.querySelectorAll('[data-print]').forEach((btn) =>
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      window.print();
    })
  );
  // Powiększanie tekstu artykułu
  document.querySelectorAll('[data-font-size]').forEach((btn) =>
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const body = document.querySelector('.art-body');
      if (!body) return;
      const step = Number(btn.dataset.fontSize);
      const cur = parseFloat(getComputedStyle(body).fontSize) || 17;
      const next = Math.min(24, Math.max(14, cur + step));
      body.style.fontSize = next + 'px';
      body.querySelectorAll('p, li').forEach((el) => (el.style.fontSize = next + 'px'));
    })
  );

  // Pasek postępu czytania
  const artBody = document.querySelector('.art-body');
  if (artBody) {
    const prog = document.createElement('div');
    prog.style.cssText =
      'position:fixed;top:0;left:0;height:3px;background:var(--red);z-index:9999;width:0;transition:width 80ms linear';
    document.body.appendChild(prog);
    const onScroll = () => {
      const rect = artBody.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const done = Math.min(1, Math.max(0, -rect.top / (total > 0 ? total : 1)));
      prog.style.width = done * 100 + '%';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();

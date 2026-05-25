(() => {
  if (window.__izbicaSearchAutocomplete) return;
  window.__izbicaSearchAutocomplete = true;

  const debounce = (fn, wait = 300) => {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), wait);
    };
  };

  const enhanceInput = (input) => {
    const form = input.closest('form');
    if (!form || input.dataset.autocompleteReady === 'true') return;
    input.dataset.autocompleteReady = 'true';
    form.style.position = form.style.position || 'relative';

    const box = document.createElement('div');
    box.className = 'search-autocomplete-results';
    box.hidden = true;
    box.setAttribute('role', 'listbox');
    box.style.cssText = 'position:absolute;left:0;right:0;top:calc(100% + 8px);background:#fff;border:1px solid rgba(10,37,64,.12);border-radius:12px;box-shadow:0 16px 36px rgba(10,37,64,.12);z-index:30;padding:8px;';
    form.appendChild(box);

    let activeIndex = -1;
    let items = [];

    const hide = () => {
      box.hidden = true;
      box.innerHTML = '';
      items = [];
      activeIndex = -1;
    };

    const render = (results, query) => {
      if (!results.length) {
        box.innerHTML = '<div style="padding:12px 14px;color:#64748b;font:500 14px/1.4 Inter,sans-serif;">Brak szybkich podpowiedzi dla „' + query.replace(/</g, '&lt;') + '”.</div>';
        box.hidden = false;
        items = [];
        return;
      }
      box.innerHTML = results.map((item, index) => {
        const lede = (item.lede || '').slice(0, 90);
        return '<a href="' + item.url + '" class="search-autocomplete-item" data-index="' + index + '" role="option" style="display:block;padding:10px 12px;border-radius:10px;text-decoration:none;color:#0f172a;">'
          + '<div style="font:700 14px/1.3 Inter,sans-serif;margin-bottom:4px;">' + item.title + '</div>'
          + '<div style="font:600 11px/1 Inter,sans-serif;letter-spacing:.08em;text-transform:uppercase;color:#8b1d2a;margin-bottom:5px;">' + item.category + '</div>'
          + '<div style="font:400 12px/1.45 Inter,sans-serif;color:#475569;">' + lede + '</div>'
          + '</a>';
      }).join('');
      box.hidden = false;
      items = Array.from(box.querySelectorAll('.search-autocomplete-item'));
      items.forEach((item) => {
        item.addEventListener('mouseenter', () => setActive(Number(item.dataset.index || -1)));
      });
    };

    const setActive = (index) => {
      activeIndex = index;
      items.forEach((item, current) => {
        item.style.background = current === activeIndex ? 'rgba(184,48,42,.08)' : 'transparent';
      });
    };

    const loadSuggestions = debounce(async () => {
      const query = input.value.trim();
      if (query.length < 2) {
        hide();
        return;
      }
      try {
        const response = await fetch('/api/v1/search?q=' + encodeURIComponent(query) + '&limit=6', {
          headers: { Accept: 'application/json' },
        });
        const payload = await response.json();
        render(Array.isArray(payload.items) ? payload.items : [], query);
      } catch (error) {
        console.warn('[search-autocomplete] fetch failed', error);
        hide();
      }
    }, 300);

    input.addEventListener('input', loadSuggestions);
    input.addEventListener('focus', loadSuggestions);
    input.addEventListener('keydown', (event) => {
      if (box.hidden || !items.length) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActive((activeIndex + 1) % items.length);
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActive(activeIndex <= 0 ? items.length - 1 : activeIndex - 1);
      }
      if (event.key === 'Enter' && activeIndex >= 0 && items[activeIndex]) {
        event.preventDefault();
        window.location.href = items[activeIndex].href;
      }
      if (event.key === 'Escape') hide();
    });

    document.addEventListener('click', (event) => {
      if (!form.contains(event.target)) hide();
    });
  };

  const boot = () => {
    document.querySelectorAll('.search-input, input[type="search"][name="q"]').forEach(enhanceInput);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();


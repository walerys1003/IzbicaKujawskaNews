(() => {
  if (window.__izbicaInfiniteScroll) return;
  window.__izbicaInfiniteScroll = true;

  const boot = () => {
    const searchResults = document.querySelector('.search-results');
    const categoryGrid = document.querySelector('.cat-grid');
    const pageType = searchResults ? 'search' : categoryGrid ? 'category' : null;
    if (!pageType) return;

    const target = searchResults || categoryGrid;
    const sentinel = document.createElement('div');
    sentinel.className = 'infinite-scroll-sentinel';
    sentinel.style.cssText = 'height:1px;margin-top:24px;';
    target.parentNode && target.parentNode.appendChild(sentinel);

    const status = document.createElement('div');
    status.className = 'infinite-scroll-status';
    status.style.cssText = 'padding:16px 0;text-align:center;color:#64748b;font:500 14px/1.4 Inter,sans-serif;';
    sentinel.insertAdjacentElement('afterend', status);

    const params = new URLSearchParams(window.location.search);
    const query = params.get('q') || '';
    const category = window.location.pathname.split('/').filter(Boolean)[0] || '';
    let offset = target.children.length;
    let loading = false;
    let finished = false;
    const limit = 12;

    const renderSearchItem = (item) => {
      const li = document.createElement('li');
      li.className = 'search-result';
      li.innerHTML = '<a href="' + item.url + '">'
        + '<span class="search-result-cat">' + item.category + '</span>'
        + '<h3>' + item.title + '</h3>'
        + '<p>' + (item.lede || '').slice(0, 180) + '</p>'
        + '<small>' + (item.publishedAt || '') + '</small>'
        + '</a>';
      return li;
    };

    const renderCategoryItem = (item) => {
      const article = document.createElement('article');
      article.className = 'cat-card';
      article.innerHTML = '<a href="' + item.url + '" class="cat-card-link">'
        + '<div class="cat-card-image"><img src="' + (item.heroImage || '') + '" alt="" loading="lazy"></div>'
        + '<div class="cat-card-body">'
        + '<span class="eyebrow" style="color:' + (item.categoryColor || '#8b1d2a') + '">' + (item.category || '').toUpperCase() + '</span>'
        + '<h3 class="cat-card-title">' + item.title + '</h3>'
        + '<p class="cat-card-lede">' + (item.lede || '').slice(0, 140) + '…</p>'
        + '<div class="cat-card-meta"><span>' + (item.author || '') + '</span><span class="dot"></span><time>' + (item.publishedAt || '') + '</time></div>'
        + '</div></a>';
      return article;
    };

    const fetchNext = async () => {
      if (loading || finished) return;
      loading = true;
      status.textContent = 'Ładowanie kolejnych materiałów…';
      try {
        const endpoint = pageType === 'search'
          ? '/api/v1/search?q=' + encodeURIComponent(query) + '&offset=' + offset + '&limit=' + limit
          : '/api/v1/articles?category=' + encodeURIComponent(category) + '&offset=' + offset + '&limit=' + limit;
        const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
        const payload = await response.json();
        const items = Array.isArray(payload.items) ? payload.items : [];
        if (!items.length) {
          finished = true;
          status.textContent = 'To już wszystkie materiały.';
          return;
        }
        items.forEach((item) => target.appendChild(pageType === 'search' ? renderSearchItem(item) : renderCategoryItem(item)));
        offset += items.length;
        status.textContent = 'Przewiń dalej, aby załadować więcej.';
        if (items.length < limit) {
          finished = true;
          status.textContent = 'To już wszystkie materiały.';
        }
      } catch (error) {
        console.warn('[infinite-scroll] fetch failed', error);
        status.textContent = 'Nie udało się pobrać kolejnych materiałów.';
      } finally {
        loading = false;
      }
    };

    if (!('IntersectionObserver' in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) fetchNext();
      });
    }, { rootMargin: '300px 0px' });
    observer.observe(sentinel);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();


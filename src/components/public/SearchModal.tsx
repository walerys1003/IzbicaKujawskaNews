// SA6: Search Modal overlay with autocomplete + keyboard shortcuts
export const SearchModalScript = () => `
<div id="search-modal" class="search-modal-overlay" style="display: none; position: fixed; inset: 0; z-index: 99999; background: rgba(0,0,0,0.7); align-items: flex-start; justify-content: center; padding-top: 15vh;" role="dialog" aria-modal="true" aria-label="Szukaj na portalu">
  <div class="search-modal-content" style="background: #fff; border-radius: 12px; width: 100%; max-width: 640px; box-shadow: 0 20px 60px rgba(0,0,0,0.4); overflow: hidden;">
    <div style="display: flex; align-items: center; gap: 12px; padding: 16px 20px; border-bottom: 1px solid #eee;">
      <span style="font-size: 20px;">🔍</span>
      <input
        type="text"
        id="search-modal-input"
        placeholder="Szukaj artyku\u00f3w, kategorii, autor\u00f3w..."
        autocomplete="off"
        style="flex: 1; border: none; outline: none; font-size: 18px; padding: 4px 0;"
        onkeydown="if(event.key==='Escape')closeSearchModal()"
      />
      <kbd style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px; font-size: 12px; color: #666; border: 1px solid #ddd;">ESC</kbd>
    </div>
    <div id="search-modal-results" style="max-height: 400px; overflow-y: auto; padding: 8px 0;">
      <div style="padding: 32px; text-align: center; color: #999;">Zacznij pisa\u0107, aby wyszuka\u0107...</div>
    </div>
    <div id="search-modal-footer" style="padding: 10px 20px; border-top: 1px solid #eee; display: flex; gap: 16px; font-size: 12px; color: #888;">
      <span><kbd style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px; border: 1px solid #ddd;">\u2191\u2193</kbd> Nawigacja</span>
      <span><kbd style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px; border: 1px solid #ddd;">Enter</kbd> Otw\u00f3rz</span>
      <span><kbd style="background: #f0f0f0; padding: 2px 6px; border-radius: 3px; border: 1px solid #ddd;">Esc</kbd> Zamknij</span>
    </div>
  </div>
</div>

<script>
let searchDebounceTimer = null;
let searchSelectedIndex = -1;
let searchResultsItems = [];

function openSearchModal() {
  document.getElementById('search-modal').style.display = 'flex';
  document.getElementById('search-modal-input').focus();
  document.getElementById('search-modal-input').value = '';
  document.getElementById('search-modal-results').innerHTML = '<div style="padding: 32px; text-align: center; color: #999;">Zacznij pisa\u0107, aby wyszuka\u0107...</div>';
  searchSelectedIndex = -1;
  searchResultsItems = [];
}

function closeSearchModal() {
  document.getElementById('search-modal').style.display = 'none';
  searchSelectedIndex = -1;
  searchResultsItems = [];
}

// Keyboard shortcut: Ctrl+K or /
document.addEventListener('keydown', function(e) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); openSearchModal(); return; }
  if (e.key === '/' && !['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) { e.preventDefault(); openSearchModal(); return; }
  if (e.key === 'Escape') { closeSearchModal(); }
});

document.getElementById('search-modal-input').addEventListener('input', function(e) {
  clearTimeout(searchDebounceTimer);
  const q = e.target.value.trim();
  if (!q) {
    document.getElementById('search-modal-results').innerHTML = '<div style="padding: 32px; text-align: center; color: #999;">Zacznij pisa\u0107, aby wyszuka\u0107...</div>';
    return;
  }
  searchDebounceTimer = setTimeout(async () => {
    const res = await fetch('/api/v1/search/autocomplete?q=' + encodeURIComponent(q));
    const data = await res.json();
    searchResultsItems = data.items || [];
    searchSelectedIndex = -1;
    renderSearchResults(searchResultsItems);
  }, 200);
});

document.getElementById('search-modal-input').addEventListener('keydown', function(e) {
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    searchSelectedIndex = Math.min(searchSelectedIndex + 1, searchResultsItems.length - 1);
    updateSearchSelection();
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    searchSelectedIndex = Math.max(searchSelectedIndex - 1, -1);
    updateSearchSelection();
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (searchSelectedIndex >= 0 && searchResultsItems[searchSelectedIndex]) {
      window.location.href = '/szukaj?q=' + encodeURIComponent(searchResultsItems[searchSelectedIndex]);
    } else {
      window.location.href = '/szukaj?q=' + encodeURIComponent(e.target.value);
    }
  }
});

function renderSearchResults(items) {
  if (items.length === 0) {
    document.getElementById('search-modal-results').innerHTML = '<div style="padding: 32px; text-align: center; color: #999;">Brak wynik\u00f3w</div>';
    return;
  }
  document.getElementById('search-modal-results').innerHTML = items.map(function(item, i) {
    return '<div class="search-result-item" data-index="' + i + '" style="padding: 12px 20px; cursor: pointer; border-left: 3px solid transparent; transition: background 0.15s;" onmouseover="searchSelectedIndex=' + i + '; updateSearchSelection();" onclick="window.location.href=\\'/szukaj?q=' + encodeURIComponent(item) + '\\'">' +
      '<span style="font-size: 14px; color: #1a1a2e;">' + (typeof item === 'string' ? item : (item.title || item)) + '</span>' +
    '</div>';
  }).join('');
}

function updateSearchSelection() {
  document.querySelectorAll('.search-result-item').forEach(function(el, i) {
    if (i === searchSelectedIndex) {
      el.style.background = '#f0f4ff';
      el.style.borderLeftColor = '#e94560';
    } else {
      el.style.background = 'transparent';
      el.style.borderLeftColor = 'transparent';
    }
  });
}

// Click outside to close
document.getElementById('search-modal').addEventListener('click', function(e) {
  if (e.target === this) closeSearchModal();
});
</script>
`

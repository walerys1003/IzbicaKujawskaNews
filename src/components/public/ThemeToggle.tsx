// SA6 + SA7: DarkModeToggle + FontSizeToggle (Accessibility)
export const AccessibilityBarScript = () => `
<div id="a11y-bar" style="position: fixed; top: 80px; right: 16px; z-index: 99997; display: flex; flex-direction: column; gap: 8px;">
  <!-- Dark mode toggle -->
  <button id="dark-mode-toggle" onclick="toggleDarkMode()" aria-label="Przełącz tryb ciemny" title="Tryb ciemny"
    style="width: 40px; height: 40px; border-radius: 50%; background: #1a1a2e; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
    🌙
  </button>

  <!-- Font size controls -->
  <button onclick="changeFontSize(-1)" aria-label="Zmniejsz czcionkę" title="Mniejsza czcionka"
    style="width: 40px; height: 40px; border-radius: 50%; background: #1a1a2e; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
    A-
  </button>
  <button onclick="resetFontSize()" aria-label="Resetuj czcionkę" title="Domyślna czcionka"
    style="width: 40px; height: 40px; border-radius: 50%; background: #1a1a2e; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
    A
  </button>
  <button onclick="changeFontSize(1)" aria-label="Zwiększ czcionkę" title="Większa czcionka"
    style="width: 40px; height: 40px; border-radius: 50%; background: #1a1a2e; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
    A+
  </button>

  <!-- Print button -->
  <button onclick="window.print()" aria-label="Drukuj" title="Drukuj stronę"
    style="width: 40px; height: 40px; border-radius: 50%; background: #1a1a2e; color: white; border: none; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 18px; box-shadow: 0 2px 8px rgba(0,0,0,0.2);">
    🖨
  </button>
</div>

<script>
(function() {
  const FONT_SIZES = [14, 16, 18, 20, 22, 24];
  let fontSizeIndex = FONT_SIZES.indexOf(16);

  // Dark mode
  function toggleDarkMode() {
    const isDark = document.documentElement.classList.toggle('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('dark-mode-toggle').textContent = isDark ? '☀️' : '🌙';
    document.getElementById('dark-mode-toggle').setAttribute('aria-label', isDark ? 'Przełącz tryb jasny' : 'Przełącz tryb ciemny');
  }
  window.toggleDarkMode = toggleDarkMode;

  // Initialize theme
  if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark-mode');
    document.getElementById('dark-mode-toggle').textContent = '☀️';
  }

  // Font size controls
  function applyFontSize(size) {
    document.documentElement.style.fontSize = size + 'px';
    localStorage.setItem('fontSize', size);
  }

  window.changeFontSize = function(delta) {
    fontSizeIndex = Math.max(0, Math.min(FONT_SIZES.length - 1, fontSizeIndex + delta));
    applyFontSize(FONT_SIZES[fontSizeIndex]);
  };

  window.resetFontSize = function() {
    fontSizeIndex = FONT_SIZES.indexOf(16);
    applyFontSize(16);
  };

  // Initialize font size
  var savedSize = parseInt(localStorage.getItem('fontSize'));
  if (savedSize && FONT_SIZES.includes(savedSize)) {
    fontSizeIndex = FONT_SIZES.indexOf(savedSize);
    applyFontSize(savedSize);
  }

  // Reduced motion support
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.documentElement.style.setProperty('--transition-duration', '0s');
  }

  // Skip to main content
  var skipLink = document.querySelector('.skip-to-main');
  if (skipLink) {
    skipLink.addEventListener('click', function(e) {
      var main = document.getElementById('page-main');
      if (main) { main.focus(); main.scrollIntoView(); }
    });
  }
})();
</script>

<style id="dark-mode-styles">
  html.dark-mode {
    --bg-primary: #1a1a2e;
    --bg-secondary: #16213e;
    --text-primary: #e0e0e0;
    --text-secondary: #aaa;
  }
  html.dark-mode body {
    background: #0f3460;
    color: #e0e0e0;
  }
  html.dark-mode .search-modal-content,
  html.dark-mode .share-modal-content {
    background: #1a1a2e !important;
    color: #e0e0e0 !important;
  }
  html.dark-mode input, html.dark-mode textarea {
    background: #0f3460;
    color: #e0e0e0;
    border-color: #444;
  }
  html.dark-mode a {
    color: #ff6b6b;
  }
</style>
`

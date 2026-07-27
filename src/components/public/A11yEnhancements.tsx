// SA7: A11yEnhancements — SkipLink, FocusRing helper, ARIA live region, reduced motion toggle
// Drop-in component that adds accessibility enhancements to every page

/** Skip-to-main-content link — invisible until focused by keyboard */
export const SkipLink = () => (
  <a
    href="#page-main"
    class="skip-link"
    style={{
      position: 'absolute',
      top: '-100px',
      left: '8px',
      zIndex: 9999,
      padding: '10px 20px',
      background: '#e94560',
      color: '#fff',
      fontWeight: 700,
      fontSize: '14px',
      borderRadius: '0 0 6px 6px',
      textDecoration: 'none',
      transition: 'top 0.2s ease',
    }}
  >
    Przejdź do treści (Skip to main content)
  </a>
)

/** Global CSS + JS for accessibility enhancements.
 *  Includes: focus-ring for keyboard users, reduced-motion respect, ARIA live region for dynamic updates,
 *  print-link-expansion, screen-reader-only utility class.
 *  Call once in the layout shell.
 */
export const A11yGlobalStyles = () => (
  <>
    <style>{`
      /* === Skip Link === */
      .skip-link:focus {
        top: 8px;
      }

      /* === Focus Ring — visible only for keyboard users === */
      :focus-visible {
        outline: 3px solid #e94560 !important;
        outline-offset: 2px;
      }

      /* Hide focus ring for mouse users */
      :focus:not(:focus-visible) {
        outline: none !important;
      }

      /* === Reduced Motion === */
      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
          scroll-behavior: auto !important;
        }
      }

      /* === Screen Reader Only === */
      .sr-only {
        position: absolute;
        width: 1px;
        height: 1px;
        padding: 0;
        margin: -1px;
        overflow: hidden;
        clip: rect(0, 0, 0, 0);
        white-space: nowrap;
        border: 0;
      }

      /* === Print Styles === */
      @media print {
        nav, footer, .skip-link, .cookie-consent-banner, .newsletter-cta, .share-modal { display: none !important; }
        a[href]::after { content: " (" attr(href) ")"; font-size: 80%; color: #666; }
        body { font-size: 12pt; line-height: 1.6; }
        .article-title { font-size: 20pt !important; }
      }
    `}</style>

    {/* ARIA live region for dynamic content updates */}
    <div id="aria-live-polite" class="sr-only" aria-live="polite" role="status" />
    <div id="aria-live-assertive" class="sr-only" aria-live="assertive" role="alert" />

    {/* Keyboard focus indicator script — adds class when user is tabbing */}
    <script
      dangerouslySetInnerHTML={{
        __html: `
(function() {
  var usingKeyboard = false;
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Tab') {
      usingKeyboard = true;
      document.body.classList.add('keyboard-user');
    }
  });
  document.addEventListener('mousedown', function() {
    usingKeyboard = false;
    document.body.classList.remove('keyboard-user');
  });
})();
        `.trim(),
      }}
    />
  </>
)

/** Announce a message to screen readers via ARIA live region */
export function announceToScreenReader(message: string, assertive = false) {
  const id = assertive ? 'aria-live-assertive' : 'aria-live-polite'
  const el = document.getElementById(id)
  if (el) {
    el.textContent = ''
    // Force re-read by clearing and resetting
    requestAnimationFrame(() => { el.textContent = message })
  }
}

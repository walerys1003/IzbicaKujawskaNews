(() => {
  if (window.__izbicaPrintArticle) return;
  window.__izbicaPrintArticle = true;

  const injectStyle = () => {
    if (document.getElementById('print-article-style')) return;
    const style = document.createElement('style');
    style.id = 'print-article-style';
    style.textContent = '@media print{ .article-share,.byline-actions,.article-comments,.article-related,#main-nav,#footer,.v3-scroll-top,.cookie-consent-banner{display:none !important;} body{background:#fff !important;color:#000 !important;} .article-container{max-width:100% !important;} .article-body{font-size:12pt !important;line-height:1.6 !important;} }';
    document.head.appendChild(style);
  };

  const boot = () => {
    injectStyle();
    document.querySelectorAll('.byline-btn').forEach((button) => {
      if (!/drukuj/i.test(button.textContent || '') && button.getAttribute('aria-label') !== 'Drukuj') return;
      button.setAttribute('data-print-article', 'true');
      button.addEventListener('click', (event) => {
        event.preventDefault();
        window.print();
      });
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();


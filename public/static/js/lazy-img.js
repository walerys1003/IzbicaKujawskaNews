(() => {
  if (window.__izbicaLazyImages) return;
  window.__izbicaLazyImages = true;

  const markLoaded = (img) => {
    img.classList.add('is-loaded');
    img.style.filter = 'blur(0)';
    img.style.opacity = '1';
    img.style.transition = 'opacity .25s ease, filter .25s ease';
  };

  const reveal = (img) => {
    const src = img.dataset.src;
    if (src && img.src !== src) img.src = src;
    if (img.complete) markLoaded(img);
    else img.addEventListener('load', () => markLoaded(img), { once: true });
  };

  const boot = () => {
    const images = Array.from(document.querySelectorAll('img[loading="lazy"], img[data-src]'));
    if (!images.length) return;
    images.forEach((img) => {
      img.style.opacity = img.complete ? '1' : '.72';
      img.style.filter = img.complete ? 'blur(0)' : 'blur(8px)';
    });
    if (!('IntersectionObserver' in window)) {
      images.forEach(reveal);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        reveal(entry.target);
        observer.unobserve(entry.target);
      });
    }, { rootMargin: '200px 0px' });
    images.forEach((img) => observer.observe(img));
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();


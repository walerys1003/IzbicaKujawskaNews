(() => {
  if (window.__izbicaVideoPlayer) return;
  window.__izbicaVideoPlayer = true;

  const createIframe = (url, title) => {
    const iframe = document.createElement('iframe');
    iframe.src = url;
    iframe.title = title || 'Materiał wideo';
    iframe.loading = 'lazy';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.style.cssText = 'width:100%;height:100%;border:0;border-radius:inherit;';
    return iframe;
  };

  const boot = () => {
    document.querySelectorAll('[data-video-url], [data-youtube-id], [data-vimeo-id]').forEach((node) => {
      if (node.dataset.videoReady === 'true') return;
      node.dataset.videoReady = 'true';
      node.style.cursor = 'pointer';
      node.addEventListener('click', () => {
        const title = node.getAttribute('data-video-title') || node.getAttribute('aria-label') || 'Materiał wideo';
        let url = node.getAttribute('data-video-url');
        if (!url && node.dataset.youtubeId) url = 'https://www.youtube-nocookie.com/embed/' + node.dataset.youtubeId + '?autoplay=1';
        if (!url && node.dataset.vimeoId) url = 'https://player.vimeo.com/video/' + node.dataset.vimeoId + '?autoplay=1';
        if (!url) return;
        node.innerHTML = '';
        node.appendChild(createIframe(url, title));
      }, { once: true });
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();


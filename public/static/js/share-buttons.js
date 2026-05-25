(() => {
  if (window.__izbicaShareButtons) return;
  window.__izbicaShareButtons = true;

  const shareUrl = encodeURIComponent(window.location.href);
  const shareTitle = encodeURIComponent(document.title);

  const endpoints = {
    fb: 'https://www.facebook.com/sharer/sharer.php?u=' + shareUrl,
    x: 'https://twitter.com/intent/tweet?url=' + shareUrl + '&text=' + shareTitle,
    linkedin: 'https://www.linkedin.com/sharing/share-offsite/?url=' + shareUrl,
    mail: 'mailto:?subject=' + shareTitle + '&body=' + shareUrl,
  };

  const syncShareCount = async () => {
    const slug = window.location.pathname.split('/').filter(Boolean).pop();
    const counter = document.querySelector('.share-count');
    if (!slug || !counter) return;
    try {
      const response = await fetch('/api/v1/articles/' + encodeURIComponent(slug) + '/share', { method: 'POST' });
      const payload = await response.json();
      if (payload.shareCount) counter.textContent = String(payload.shareCount);
    } catch (error) {
      console.warn('[share-buttons] counter sync failed', error);
    }
  };

  const boot = () => {
    const buttons = document.querySelectorAll('.share-btn');
    if (!buttons.length) return;
    buttons.forEach((button) => {
      button.addEventListener('click', async () => {
        const platform = button.dataset.platform || 'copy';
        if (platform === 'copy') {
          try {
            await navigator.clipboard.writeText(window.location.href);
            button.textContent = '✓';
            setTimeout(() => { button.textContent = '🔗'; }, 1200);
          } catch (error) {
            console.warn('[share-buttons] clipboard failed', error);
          }
        } else if (platform === 'linkedin') {
          window.open(endpoints.linkedin, '_blank', 'noopener,noreferrer,width=720,height=640');
        } else if (platform === 'mail') {
          window.location.href = endpoints.mail;
        } else if (platform === 'fb' || platform === 'x') {
          window.open(endpoints[platform], '_blank', 'noopener,noreferrer,width=720,height=640');
        }
        await syncShareCount();
      });
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();


(() => {
  if (window.__izbicaNewsletterForm) return;
  window.__izbicaNewsletterForm = true;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const enhanceForm = (form) => {
    if (form.dataset.newsletterReady === 'true') return;
    form.dataset.newsletterReady = 'true';
    const status = document.createElement('div');
    status.className = 'newsletter-form-status';
    status.setAttribute('aria-live', 'polite');
    status.style.cssText = 'margin-top:12px;font:600 13px/1.4 Inter,sans-serif;color:inherit;';
    form.appendChild(status);

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const email = String(formData.get('email') || '').trim();
      const consent = Boolean(formData.get('consent'));
      if (!emailRegex.test(email)) {
        status.textContent = 'Podaj poprawny adres e-mail.';
        return;
      }
      if (!consent) {
        status.textContent = 'Wymagana jest zgoda na newsletter.';
        return;
      }
      status.textContent = 'Zapisywanie…';
      try {
        const response = await fetch(form.action || '/api/v1/newsletter/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ email, consent }),
        });
        const payload = await response.json();
        if (!response.ok || !payload.ok) throw new Error(payload.error || 'newsletter_failed');
        form.reset();
        status.textContent = payload.message || 'Sprawdź skrzynkę pocztową i potwierdź zapis.';
      } catch (error) {
        console.warn('[newsletter-form] submit failed', error);
        status.textContent = 'Nie udało się zapisać do newslettera.';
      }
    });
  };

  const boot = () => {
    document.querySelectorAll('form[action*="/newsletter/subscribe"]').forEach(enhanceForm);
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();


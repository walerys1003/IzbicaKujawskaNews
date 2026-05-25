(() => {
  if (window.__izbicaCommentsWidget) return;
  window.__izbicaCommentsWidget = true;

  const boot = () => {
    const section = document.querySelector('.article-comments');
    if (!section || section.querySelector('.comments-widget-form')) return;
    const slug = window.location.pathname.split('/').filter(Boolean).pop();
    if (!slug) return;

    const root = document.createElement('div');
    root.className = 'comments-widget';
    root.innerHTML = `
      <form class="comments-widget-form" style="display:grid;gap:12px;margin-top:18px;">
        <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;">
          <input name="name" placeholder="Imię i nazwisko" required style="padding:12px 14px;border:1px solid #cbd5e1;border-radius:10px;" />
          <input name="email" type="email" placeholder="Adres e-mail" required style="padding:12px 14px;border:1px solid #cbd5e1;border-radius:10px;" />
        </div>
        <input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px;opacity:0;pointer-events:none;" aria-hidden="true" />
        <textarea name="text" rows="5" placeholder="Dodaj komentarz…" required style="padding:12px 14px;border:1px solid #cbd5e1;border-radius:10px;"></textarea>
        <label style="display:flex;gap:10px;align-items:flex-start;font:500 13px/1.45 Inter,sans-serif;color:#475569;">
          <input name="consent" type="checkbox" required />
          <span>Akceptuję regulamin dyskusji i zgodę na przetwarzanie danych do moderacji komentarza.</span>
        </label>
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;">
          <button type="submit" style="padding:12px 18px;border:0;border-radius:999px;background:#8b1d2a;color:#fff;font:700 14px/1 Inter,sans-serif;cursor:pointer;">Wyślij komentarz</button>
          <span class="comments-widget-status" aria-live="polite" style="font:600 13px/1.4 Inter,sans-serif;color:#475569;"></span>
        </div>
      </form>
      <div class="comments-widget-list" style="display:grid;gap:12px;margin-top:18px;"></div>
    `;
    section.appendChild(root);

    const form = root.querySelector('.comments-widget-form');
    const status = root.querySelector('.comments-widget-status');
    const list = root.querySelector('.comments-widget-list');

    const addPendingComment = (name, text) => {
      const item = document.createElement('article');
      item.style.cssText = 'padding:14px 16px;border:1px solid #e2e8f0;border-radius:12px;background:#fff7f5;';
      item.innerHTML = '<strong style="display:block;margin-bottom:6px;">' + name + '</strong>'
        + '<p style="margin:0 0 8px;">' + text + '</p>'
        + '<small style="color:#8b1d2a;">Oczekuje na moderację</small>';
      list.prepend(item);
    };

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const data = new FormData(form);
      if (data.get('website')) return;
      status.textContent = 'Wysyłanie…';
      try {
        const payload = {
          articleSlug: slug,
          name: String(data.get('name') || ''),
          email: String(data.get('email') || ''),
          text: String(data.get('text') || ''),
          consent: Boolean(data.get('consent')),
        };
        const response = await fetch('/api/v1/comments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await response.json();
        if (!response.ok || !result.ok) throw new Error(result.error || 'submit_failed');
        addPendingComment(payload.name, payload.text);
        form.reset();
        status.textContent = 'Komentarz został wysłany do moderacji.';
      } catch (error) {
        console.warn('[comments-widget] submit failed', error);
        status.textContent = 'Nie udało się wysłać komentarza.';
      }
    });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();


(() => {
  if (window.__izbicaCookieConsent) return;
  window.__izbicaCookieConsent = true;
  const STORAGE_KEY = 'izbica24:cookie-consent';

  const boot = () => {
    if (localStorage.getItem(STORAGE_KEY)) return;
    const banner = document.createElement('aside');
    banner.className = 'cookie-consent-banner';
    banner.style.cssText = 'position:fixed;left:24px;right:24px;bottom:24px;z-index:1000;background:#0a2540;color:#fff;padding:18px 20px;border-radius:18px;box-shadow:0 20px 40px rgba(2,6,23,.28);display:grid;gap:12px;max-width:960px;margin:0 auto;';
    banner.innerHTML = `
      <strong style="font:800 16px/1 Inter,sans-serif;">Ustawienia prywatności i plików cookie</strong>
      <p style="margin:0;font:400 14px/1.5 Inter,sans-serif;color:rgba(255,255,255,.88);">Używamy cookies do działania portalu, analityki i personalizacji. Możesz zaakceptować wszystko, odrzucić opcjonalne zgody albo dostosować ustawienia.</p>
      <label style="display:flex;gap:10px;align-items:center;font:500 13px/1.4 Inter,sans-serif;"><input type="checkbox" checked disabled> Niezbędne</label>
      <label style="display:flex;gap:10px;align-items:center;font:500 13px/1.4 Inter,sans-serif;"><input type="checkbox" data-cookie="analytics" checked> Analityka</label>
      <label style="display:flex;gap:10px;align-items:center;font:500 13px/1.4 Inter,sans-serif;"><input type="checkbox" data-cookie="marketing"> Marketing</label>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <button type="button" data-action="accept" style="padding:10px 14px;border-radius:999px;border:0;background:#c8a951;color:#0a2540;font:800 13px/1 Inter,sans-serif;cursor:pointer;">Akceptuj wszystko</button>
        <button type="button" data-action="reject" style="padding:10px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:transparent;color:#fff;font:700 13px/1 Inter,sans-serif;cursor:pointer;">Odrzuć opcjonalne</button>
        <button type="button" data-action="save" style="padding:10px 14px;border-radius:999px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.08);color:#fff;font:700 13px/1 Inter,sans-serif;cursor:pointer;">Zapisz wybór</button>
      </div>
    `;
    document.body.appendChild(banner);

    const save = (mode) => {
      const analytics = banner.querySelector('[data-cookie="analytics"]').checked;
      const marketing = banner.querySelector('[data-cookie="marketing"]').checked;
      const payload = mode === 'accept'
        ? { necessary: true, analytics: true, marketing: true }
        : mode === 'reject'
          ? { necessary: true, analytics: false, marketing: false }
          : { necessary: true, analytics, marketing };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
      banner.remove();
    };

    banner.querySelector('[data-action="accept"]').addEventListener('click', () => save('accept'));
    banner.querySelector('[data-action="reject"]').addEventListener('click', () => save('reject'));
    banner.querySelector('[data-action="save"]').addEventListener('click', () => save('save'));
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();


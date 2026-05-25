export const Error404 = ({ path }: { path: string }) => (
  <section class="subpage-shell" style="padding:48px 20px;">
    <div style="max-width:860px; margin:0 auto; background:#fff; border:1px solid #e5e7eb; padding:40px; text-align:center; box-shadow:0 20px 40px rgba(15,23,42,.06);">
      <div style="font:800 96px/1 Inter, sans-serif; color:#8b1d2a; margin-bottom:12px;">404</div>
      <h1 style="font:700 40px/1.1 'Playfair Display',serif; margin:0 0 12px 0; color:#111827;">Nie znaleźliśmy tej strony</h1>
      <p style="font:400 18px/1.7 Lora, serif; color:#475569; max-width:40ch; margin:0 auto 24px;">Adres <code>{path}</code> nie prowadzi do aktywnej podstrony. Sprawdź pisownię albo wróć do jednego z głównych działów portalu.</p>
      <div style="display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
        <a href="/" style="padding:12px 16px; background:#0a2540; color:#fff; text-decoration:none; border-radius:999px; font:600 13px Inter, sans-serif;">Strona główna</a>
        <a href="/szukaj" style="padding:12px 16px; background:#8b1d2a; color:#fff; text-decoration:none; border-radius:999px; font:600 13px Inter, sans-serif;">Wyszukiwarka</a>
        <a href="/kontakt" style="padding:12px 16px; background:#fff; color:#111827; text-decoration:none; border:1px solid #d1d5db; border-radius:999px; font:600 13px Inter, sans-serif;">Kontakt</a>
      </div>
    </div>
  </section>
)

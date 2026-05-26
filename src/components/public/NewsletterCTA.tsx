// SA6: NewsletterCTA — inline call-to-action with fetch to /api/v1/newsletter/subscribe
// Includes client-side validation and success/error states
export const NewsletterCTA = ({ variant = 'inline' }: { variant?: 'inline' | 'hero' | 'sidebar' }) => {
  const isHero = variant === 'hero'
  const isSidebar = variant === 'sidebar'

  return (
    <section
      class={`newsletter-cta newsletter-cta--${variant}`}
      aria-labelledby="newsletter-cta-heading"
      style={{
        background: isHero
          ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)'
          : isSidebar
            ? '#f8f9fa'
            : 'linear-gradient(135deg, #1a1a2e 0%, #2d2d44 100%)',
        borderRadius: '12px',
        padding: isHero ? '40px 32px' : isSidebar ? '20px 18px' : '32px 24px',
        margin: '32px 0',
        color: isSidebar ? '#1a1a2e' : '#fff',
        border: isSidebar ? '1px solid #dee2e6' : 'none',
      }}
    >
      <div style={{ maxWidth: isHero ? '600px' : 'none', margin: isHero ? '0 auto' : '0', textAlign: isHero ? 'center' : 'left' }}>
        <h3
          id="newsletter-cta-heading"
          style={{
            fontSize: isHero ? '24px' : '18px',
            fontWeight: 700,
            margin: '0 0 8px',
            color: isSidebar ? '#1a1a2e' : '#fff',
          }}
        >
          📬 {isHero ? 'Bądź na bieżąco z izbica24.pl' : 'Newsletter izbica24.pl'}
        </h3>
        <p style={{
          fontSize: isHero ? '16px' : '14px',
          lineHeight: 1.6,
          margin: '0 0 20px',
          opacity: 0.85,
          color: isSidebar ? '#495057' : '#e0e0e0',
        }}>
          {isHero
            ? 'Zapisz się do newslettera i otrzymuj najważniejsze informacje z Gminy Izbica Kujawska prosto na swoją skrzynkę. Zero spamu — tylko wartościowe treści.'
            : 'Najważniejsze informacje z gminy prosto na Twoją skrzynkę. Bez spamu.'}
        </p>

        <form
          id={`newsletter-form-${variant}`}
          class="newsletter-form"
          style={{
            display: 'flex',
            gap: '8px',
            flexDirection: isSidebar ? 'column' : 'row',
            maxWidth: isSidebar ? '100%' : '500px',
            margin: isHero ? '0 auto' : '0',
          }}
        >
          <input
            type="email"
            name="email"
            placeholder="Twój adres e-mail"
            required
            aria-label="Adres e-mail do newslettera"
            style={{
              flex: 1,
              padding: '12px 16px',
              borderRadius: '8px',
              border: isSidebar ? '1px solid #ced4da' : '1px solid rgba(255,255,255,0.2)',
              background: isSidebar ? '#fff' : 'rgba(255,255,255,0.1)',
              color: isSidebar ? '#1a1a2e' : '#fff',
              fontSize: '14px',
              outline: 'none',
              width: isSidebar ? '100%' : 'auto',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '12px 28px',
              borderRadius: '8px',
              border: 'none',
              background: '#e94560',
              color: '#fff',
              fontSize: '14px',
              fontWeight: 700,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'background 0.2s',
              width: isSidebar ? '100%' : 'auto',
            }}
          >
            Zapisz się
          </button>
        </form>

        {/* Status message area (hidden by default) */}
        <div
          id={`newsletter-status-${variant}`}
          class="newsletter-status"
          role="status"
          aria-live="polite"
          style={{ display: 'none', marginTop: '12px', padding: '10px 16px', borderRadius: '8px', fontSize: '13px' }}
        />

        <p style={{ fontSize: '11px', marginTop: '12px', opacity: 0.6, color: isSidebar ? '#6c757d' : '#ccc' }}>
          Zapisując się, akceptujesz naszą{' '}
          <a href="/polityka-prywatnosci" style={{ color: '#e94560' }}>politykę prywatności</a>.
          Możesz wypisać się w każdej chwili.
        </p>
      </div>

      {/* Client-side form handler */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
(function() {
  var form = document.getElementById('newsletter-form-${variant}');
  var status = document.getElementById('newsletter-status-${variant}');
  if (!form || !status) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var email = form.email.value.trim();
    if (!email || !email.includes('@')) {
      status.style.display = 'block';
      status.style.background = '#fff3cd';
      status.style.color = '#856404';
      status.textContent = 'Proszę podać prawidłowy adres e-mail.';
      return;
    }

    var btn = form.querySelector('button');
    var origText = btn.textContent;
    btn.textContent = 'Wysyłanie…';
    btn.disabled = true;

    fetch('/api/v1/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email }),
    })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        status.style.display = 'block';
        if (data.ok) {
          status.style.background = '#d4edda';
          status.style.color = '#155724';
          status.textContent = '✓ Dziękujemy! Sprawdź swoją skrzynkę, aby potwierdzić subskrypcję.';
          form.reset();
        } else if (data.error === 'duplicate') {
          status.style.background = '#fff3cd';
          status.style.color = '#856404';
          status.textContent = 'Ten adres jest już zapisany do newslettera.';
        } else {
          status.style.background = '#f8d7da';
          status.style.color = '#721c24';
          status.textContent = 'Wystąpił błąd. Spróbuj ponownie później.';
        }
      })
      .catch(function() {
        status.style.display = 'block';
        status.style.background = '#f8d7da';
        status.style.color = '#721c24';
        status.textContent = 'Błąd połączenia. Sprawdź internet i spróbuj ponownie.';
      })
      .finally(function() {
        btn.textContent = origText;
        btn.disabled = false;
      });
  });
})();
          `.trim(),
        }}
      />
    </section>
  )
}

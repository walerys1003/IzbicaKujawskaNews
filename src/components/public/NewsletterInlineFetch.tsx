// SA6.3: NewsletterInlineWithFetch — CTA component connected to /api/v1/newsletter/subscribe
export const NewsletterInlineWithFetch = (props: {
  title?: string
  subtitle?: string
  buttonText?: string
  successMessage?: string
}) => {
  const title = props.title || 'Newsletter izbica24.pl'
  const subtitle = props.subtitle || 'Najważniejsze informacje z gminy co tydzień na Twojej skrzynce. Zero spamu.'
  const buttonText = props.buttonText || 'Zapisz się'
  const successMessage = props.successMessage || 'Sprawdź skrzynkę — wysłaliśmy link aktywacyjny!'

  return (
    <section class="newsletter-inline-fetch modv2" aria-labelledby="nl-heading" style={`
      background: linear-gradient(135deg, #0a2540 0%, #162d50 50%, #1a3a6c 100%);
      color: #fff; padding: 48px 24px; margin: 48px 0; border-radius: 12px;
      text-align: center; position: relative; overflow: hidden;
    `}>
      {/* Decorative circles */}
      <div aria-hidden="true" style="position: absolute; top: -60px; right: -40px; width: 200px; height: 200px; border-radius: 50%; background: rgba(200,169,81,0.1); pointer-events: none;" />
      <div aria-hidden="true" style="position: absolute; bottom: -30px; left: -30px; width: 120px; height: 120px; border-radius: 50%; background: rgba(200,169,81,0.08); pointer-events: none;" />

      <div style="position: relative; z-index: 1; max-width: 520px; margin: 0 auto;">
        <span aria-hidden="true" style="font-size: 32px; display: block; margin-bottom: 12px;">📬</span>
        <h2 id="nl-heading" style="margin: 0 0 8px; font-size: 24px; font-weight: 700; color: #c8a951;">
          {title}
        </h2>
        <p style="margin: 0 0 24px; font-size: 14px; line-height: 1.6; opacity: 0.85;">
          {subtitle}
        </p>

        {/* Form */}
        <form
          id="newsletter-inline-form"
          class="newsletter-inline-form"
          style="display: flex; gap: 8px; max-width: 400px; margin: 0 auto;"
        >
          <input
            type="email"
            name="email"
            id="nl-email-input"
            placeholder="Twój adres e-mail"
            required
            aria-label="Adres e-mail"
            style={`
              flex: 1; padding: 12px 16px; border: 2px solid rgba(255,255,255,0.2);
              border-radius: 8px; font-size: 14px; color: #0a2540; background: #fff;
              outline: none; transition: border-color 0.2s;
            `}
          />
          <button
            type="submit"
            id="nl-submit-btn"
            style={`
              padding: 12px 24px; background: #c8a951; color: #0a2540;
              border: none; border-radius: 8px; font-weight: 700; font-size: 14px;
              cursor: pointer; transition: background 0.2s; white-space: nowrap;
            `}
          >
            {buttonText}
          </button>
        </form>

        {/* Status message */}
        <div
          id="nl-status"
          role="status"
          aria-live="polite"
          style="margin-top: 12px; font-size: 13px; min-height: 20px;"
        />

        <p style="margin: 16px 0 0; font-size: 11px; opacity: 0.6;">
          Zero spamu. W każdej chwili możesz się wypisać. <a href="/polityka-prywatnosci" style="color: #c8a951;">Polityka prywatności</a>.
        </p>
      </div>

      {/* Client-side script */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          var form = document.getElementById('newsletter-inline-form');
          var input = document.getElementById('nl-email-input');
          var btn = document.getElementById('nl-submit-btn');
          var status = document.getElementById('nl-status');

          form.addEventListener('submit', function(e) {
            e.preventDefault();
            var email = input.value.trim();
            if (!email || !email.includes('@')) {
              status.innerHTML = '<span style="color:#f77;">Proszę podać prawidłowy adres e-mail.</span>';
              return;
            }
            btn.disabled = true;
            btn.textContent = 'Zapisywanie…';
            status.innerHTML = '';

            fetch('/api/v1/newsletter/subscribe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email: email })
            })
            .then(function(res) { return res.json(); })
            .then(function(data) {
              if (data.ok) {
                status.innerHTML = '<span style="color:#c8a951;font-weight:600;">${successMessage}</span>';
                input.value = '';
                btn.textContent = '✅ Zapisano!';
              } else {
                status.innerHTML = '<span style="color:#f77;">' + (data.error || 'Błąd zapisu.') + '</span>';
                btn.disabled = false;
                btn.textContent = '${buttonText}';
              }
            })
            .catch(function() {
              status.innerHTML = '<span style="color:#f77;">Błąd sieci. Spróbuj ponownie.</span>';
              btn.disabled = false;
              btn.textContent = '${buttonText}';
            });
          });

          // Auto-focus on Ctrl+Shift+N
          document.addEventListener('keydown', function(e) {
            if (e.ctrlKey && e.shiftKey && e.key === 'N') {
              e.preventDefault();
              input.focus();
            }
          });
        })();
      `}} />
    </section>
  )
}

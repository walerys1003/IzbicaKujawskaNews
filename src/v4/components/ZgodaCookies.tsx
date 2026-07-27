// ============================================================================
// IZBICA24.PL — BANER ZGODY NA ANALITYKĘ (etap I12)
//
// ════════════════════════════════════════════════════════════════════════════
// CO TU JEST, A CZEGO NIE MA
// ════════════════════════════════════════════════════════════════════════════
// Nie ma tu znacznika <script> analityki. To jest cała istota rozwiązania:
// skrypt pomiarowy nie znajduje się w wygenerowanym HTML w ogóle. Dopisuje
// go dopiero warstwa kliencka (izbica-v4-zgoda.js) po kliknięciu „Zgadzam
// się". Odmowa oznacza, że żądanie do beacon.min.js nigdy nie opuszcza
// przeglądarki — nie da się tego obejść blokowaniem ani wyłączeniem JS.
//
// Baner jest renderowany serwerowo z atrybutem `hidden`. Powód: czytelnik,
// który już kiedyś podjął decyzję, nie może zobaczyć mrugnięcia banera przed
// jego usunięciem (skrypt zdejmuje `hidden` tylko przy braku decyzji).
// Odwrotna kolejność — renderowanie widocznego i ukrywanie skryptem —
// oznaczałaby błysk treści przy każdym wejściu na stronę.
//
// ════════════════════════════════════════════════════════════════════════════
// DLACZEGO WCALE NIE RENDERUJEMY BANERA, GDY BRAK TOKENU
// ════════════════════════════════════════════════════════════════════════════
// Bez `CF_ANALYTICS_TOKEN` nie ma czego uruchomić, więc pytanie o zgodę na
// pomiar, którego nie prowadzimy, byłoby wprowadzaniem w błąd — i uczyłoby
// czytelników odklikiwania banerów bez czytania. W środowisku lokalnym
// baner po prostu nie istnieje.
// ============================================================================

import type { FC } from 'hono/jsx'

export const ZgodaCookies: FC<{ token?: string }> = ({ token }) => {
  if (!token) return null

  return (
    <div
      id="zgoda-cookies"
      class="zgoda"
      data-cf-token={token}
      hidden
      // `role="dialog"` + `aria-modal="false"`: to jest wydzielony blok
      // wymagający decyzji, ale NIE blokuje dostępu do treści strony.
      // Ustawienie aria-modal="true" kłamałoby czytnikowi ekranu, że
      // reszta dokumentu jest niedostępna — a jest dostępna i czytelna.
      role="dialog"
      aria-modal="false"
      aria-labelledby="zgoda-tytul"
      aria-describedby="zgoda-opis"
    >
      <div class="zgoda-tresc">
        <h2 id="zgoda-tytul" class="zgoda-tytul">
          Statystyki odwiedzin
        </h2>
        <p id="zgoda-opis" class="zgoda-opis">
          Chcemy wiedzieć, które materiały czytacie — to pomaga nam decydować, o czym pisać. Używamy
          do tego <strong>Cloudflare Web Analytics</strong>: narzędzie nie zapisuje plików cookies,
          nie tworzy profilu czytelnika i nie śledzi go na innych stronach.
          {/*
            Konkretna nazwa narzędzia, nie ogólne „nasi partnerzy". Czytelnik
            ma prawo wiedzieć, komu trafiają dane o jego wizycie, zanim
            podejmie decyzję — inaczej zgoda nie jest świadoma.
          */}
        </p>
        <p class="zgoda-opis zgoda-opis--drobne">
          Bez zgody portal działa w pełni — nie tracisz dostępu do żadnej treści.{' '}
          <a href="/polityka-cookies">Polityka plików cookies</a> ·{' '}
          <a href="/polityka-prywatnosci">Polityka prywatności</a>
        </p>
      </div>
      <div class="zgoda-przyciski">
        {/*
          Oba przyciski wyglądają równorzędnie. Typowa praktyka to duży
          kolorowy „Akceptuję" i szara, drobna „Odmowa" — taki układ
          wymusza wybór wyglądem, a nie treścią.
        */}
        <button type="button" class="zgoda-btn zgoda-btn--tak" data-zgoda="tak">
          Zgadzam się
        </button>
        <button type="button" class="zgoda-btn zgoda-btn--nie" data-zgoda="nie">
          Nie zgadzam się
        </button>
      </div>
    </div>
  )
}

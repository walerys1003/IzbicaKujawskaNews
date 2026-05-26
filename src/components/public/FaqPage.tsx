// SA8: FAQ page
import { PublicPageLayout } from './PublicPageLayout'

const faqItems = [
  { q: 'Czym jest izbica24.pl?', a: 'Izbica24.pl to niezależny portal informacyjny gminy Izbica Kujawska. Dostarczamy aktualne wiadomości, relacje z wydarzeń, ogłoszenia i materiały historyczne.' },
  { q: 'Jak mogę dodać komentarz?', a: 'Komentarze można dodawać pod każdym artykułem po wypełnieniu formularza. Komentarze są moderowane przez redakcję i publikowane po akceptacji.' },
  { q: 'Jak zapisać się na newsletter?', a: 'Formularz zapisu na newsletter znajduje się na stronie głównej oraz w stopce portalu. Wystarczy podać adres email i potwierdzić subskrypcję.' },
  { q: 'Jak zgłosić wydarzenie do kalendarza?', a: 'Wydarzenia można zgłaszać przez formularz kontaktowy lub mailowo na adres redakcja@izbica24.pl. Prosimy o podanie daty, miejsca, opisu i ewentualnego plakatu.' },
  { q: 'Czy portal jest darmowy?', a: 'Tak, portal izbica24.pl jest całkowicie darmowy dla czytelników. Utrzymujemy się z reklam lokalnych firm oraz wsparcia partnerów.' },
  { q: 'Jak zostać autorem/redaktorem?', a: 'Zapraszamy do współpracy! Skontaktuj się z nami przez formularz na stronie "Dołącz do nas" lub napisz na redakcja@izbica24.pl.' },
  { q: 'Czy treści generowane przez AI są oznaczane?', a: 'Tak. Wszystkie treści wygenerowane lub wspomagane przez sztuczną inteligencję są weryfikowane przez redakcję i odpowiednio oznaczane zgodnie z naszą polityką AI.' },
  { q: 'Jak zgłosić błąd w artykule?', a: 'Błędy można zgłaszać przez formularz kontaktowy lub bezpośrednio w komentarzu pod artykułem. Każde zgłoszenie jest rozpatrywane przez redakcję.' },
]

export const FaqPage = () => (
  <PublicPageLayout title="FAQ — Najczęściej zadawane pytania | izbica24.pl">
    <article class="faq-content">
      <h1>Najczęściej zadawane pytania</h1>

      <div class="faq-list">
        {faqItems.map((item, i) => (
          <details class="faq-item" open={i === 0}>
            <summary class="faq-question">{item.q}</summary>
            <p class="faq-answer">{item.a}</p>
          </details>
        ))}
      </div>

      <div class="faq-cta" style="margin-top: 32px; padding: 24px; background: #f5f5f5; border-radius: 8px; text-align: center;">
        <h2 style="margin-top: 0;">Nie znalazłeś odpowiedzi?</h2>
        <p>Skontaktuj się z nami przez <a href="/kontakt">formularz kontaktowy</a> lub napisz na <a href="mailto:redakcja@izbica24.pl">redakcja@izbica24.pl</a>.</p>
      </div>
    </article>
  </PublicPageLayout>
)

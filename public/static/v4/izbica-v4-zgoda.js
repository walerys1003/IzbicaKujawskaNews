// ============================================================================
// IZBICA24.PL — ZGODA NA ANALITYKĘ (etap I12)
//
// ════════════════════════════════════════════════════════════════════════════
// DLACZEGO BANER MUSI BLOKOWAĆ, A NIE TYLKO INFORMOWAĆ
// ════════════════════════════════════════════════════════════════════════════
// Najczęstszy błąd wdrożeń: skrypt analityczny stoi w <head>, a baner
// wyświetla się obok i mówi „korzystając ze strony, zgadzasz się". Wtedy
// pomiar odbywa się PRZED zgodą, więc zgoda jest fikcją — art. 6 RODO
// wymaga podstawy prawnej przed przetwarzaniem, a nie po.
//
// Tutaj jest odwrotnie: znacznik <script> analityki NIE istnieje w HTML.
// Ten plik wstrzykuje go dopiero po kliknięciu „Zgadzam się". Odmowa
// oznacza, że żądanie do beacon.min.js nigdy nie wychodzi z przeglądarki.
//
// ════════════════════════════════════════════════════════════════════════════
// DLACZEGO ZGODA JEST W localStorage, A NIE W COOKIE
// ════════════════════════════════════════════════════════════════════════════
// Cookie jest wysyłane przy KAŻDYM żądaniu do serwera — także po obrazki
// i pliki CSS. Zapis „użytkownik zgodził się na analitykę" nie jest do
// niczego potrzebny serwerowi, więc dokładanie go do każdego żądania to
// wyłącznie zbędny transfer. localStorage zostaje w przeglądarce.
//
// Dodatkowo: gdyby to było cookie, sam baner cookies wymagałby zgody na
// swoje własne cookie — a zgodnie z prawem cookie techniczne zapisujące
// wybór użytkownika jest zwolnione z obowiązku zgody. localStorage
// unika całej tej dyskusji.
//
// ════════════════════════════════════════════════════════════════════════════
// DLACZEGO NIE MA PRZYCISKU „X" (ZAMKNIJ BEZ WYBORU)
// ════════════════════════════════════════════════════════════════════════════
// Zamknięcie bez wyboru zostawia stan nieokreślony, a wtedy trzeba
// zdecydować, co robić: nie mierzyć (baner wraca przy każdym wejściu —
// uciążliwe) albo mierzyć (obejście zgody). Dwa równorzędne przyciski
// „Zgadzam się" i „Nie zgadzam się" rozstrzygają sprawę raz. Odmowa jest
// zapamiętywana tak samo trwale jak zgoda — inaczej baner karałby za „nie".
// ============================================================================

(function () {
  'use strict';

  var KLUCZ = 'izbica24:zgoda-analityka';
  var WERSJA = 1; // podniesienie = ponowne zapytanie po zmianie zakresu pomiaru

  /** Odczyt odporny na tryb prywatny (localStorage może rzucać wyjątkiem). */
  function czytaj() {
    try {
      var s = window.localStorage.getItem(KLUCZ);
      if (!s) return null;
      var o = JSON.parse(s);
      return o && o.wersja === WERSJA ? o : null;
    } catch (e) {
      return null;
    }
  }

  function zapisz(zgoda) {
    try {
      window.localStorage.setItem(
        KLUCZ,
        JSON.stringify({ wersja: WERSJA, zgoda: zgoda, kiedy: new Date().toISOString() })
      );
    } catch (e) {
      /* Tryb prywatny — decyzja obowiązuje do zamknięcia karty. Nie jest to
         powód, by odmówić działania: brak zapisu oznacza tylko, że baner
         pojawi się ponownie, a nie że mierzymy bez zgody. */
    }
  }

  /**
   * Wstrzyknięcie Cloudflare Web Analytics.
   *
   * Token przychodzi z serwera atrybutem `data-token` na kontenerze banera
   * (renderer czyta go ze zmiennej środowiskowej). Gdy tokenu nie ma —
   * na przykład w środowisku lokalnym — nie wstrzykujemy nic i nie
   * udajemy, że pomiar działa.
   */
  function wlaczAnalityke() {
    var host = document.getElementById('zgoda-cookies');
    var token = host ? host.getAttribute('data-cf-token') : null;
    if (!token) return;
    if (document.getElementById('cf-beacon')) return; // idempotentnie

    var s = document.createElement('script');
    s.id = 'cf-beacon';
    s.defer = true;
    s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
    // Cloudflare Web Analytics nie używa cookies ani nie profiluje
    // użytkowników; mimo to pytamy o zgodę, bo to nadal pomiar ruchu
    // realizowany przez podmiot trzeci.
    s.setAttribute('data-cf-beacon', JSON.stringify({ token: token }));
    document.head.appendChild(s);
  }

  function usunBaner(host) {
    if (host && host.parentNode) host.parentNode.removeChild(host);
  }

  function podepnij(host) {
    var tak = host.querySelector('[data-zgoda="tak"]');
    var nie = host.querySelector('[data-zgoda="nie"]');

    if (tak) {
      tak.addEventListener('click', function () {
        zapisz(true);
        wlaczAnalityke();
        usunBaner(host);
      });
    }
    if (nie) {
      nie.addEventListener('click', function () {
        zapisz(false);
        usunBaner(host);
      });
    }

    /* Klawiatura: baner przykrywa dolną krawędź strony, więc czytelnik
       nawigujący klawiszem Tab musi móc go opuścić. Escape = odmowa,
       bo brak decyzji nie może domyślnie oznaczać zgody. */
    host.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') {
        zapisz(false);
        usunBaner(host);
      }
    });
  }

  function start() {
    var host = document.getElementById('zgoda-cookies');
    if (!host) return;

    var stan = czytaj();

    if (stan && stan.zgoda === true) {
      wlaczAnalityke();
      usunBaner(host);
      return;
    }
    if (stan && stan.zgoda === false) {
      usunBaner(host);
      return;
    }

    /* Brak decyzji — pokazujemy baner. Do tego momentu jest on w HTML
       ukryty (klasa bez `--widoczny`), żeby nie mrugnął czytelnikowi,
       który już kiedyś wybrał. */
    host.classList.add('zgoda--widoczny');
    host.removeAttribute('hidden');
    podepnij(host);

    /* Fokus na pierwszym przycisku, ale BEZ przewijania strony
       (preventScroll) — inaczej czytelnik zostałby przeniesiony na dół
       artykułu, którego jeszcze nie zaczął czytać. */
    var pierwszy = host.querySelector('[data-zgoda]');
    if (pierwszy) {
      try {
        pierwszy.focus({ preventScroll: true });
      } catch (e) {
        /* Starsze przeglądarki nie znają preventScroll — wtedy lepiej
           nie ustawiać fokusu wcale niż przewinąć stronę. */
      }
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

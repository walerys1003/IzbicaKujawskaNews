/* ==========================================================================
   IZBICA24.PL — MAPA GMINY  (etap I10)

   Dlaczego MapLibre wczytywany dopiero tutaj, a nie w <head>:
   biblioteka waży ~250 kB (spakowana) plus arkusz stylów. Podstrona /mapa
   to jedna z ~40 tras portalu; wczytywanie tego ciężaru na stronie głównej
   i na każdym artykule pogorszyłoby Core Web Vitals (etap F4) dla ruchu,
   który mapy nigdy nie otworzy. Skrypt sam dokłada <script> i <link>
   do dokumentu, ale tylko gdy w DOM istnieje kontener #mapa-gminy.

   Dlaczego dane z osobnego żądania, a nie wstrzyknięte w HTML:
   punkty (37 obiektów) i tak nie są potrzebne przed wczytaniem biblioteki,
   a wstrzyknięcie ich w dokument powiększyłoby każdą odpowiedź o ~5 kB
   przed pierwszym renderowaniem.

   ODbL: adnotacja „© OpenStreetMap contributors" jest warunkiem licencji
   — zarówno dla kafli podkładu, jak i dla współrzędnych sołectw
   pobranych z Overpass API. Jest ustawiona w dwóch niezależnych
   miejscach (tu w MapLibre `attributionControl` i w HTML strony), żeby
   awaria jednego nie spowodowała naruszenia licencji.
   ========================================================================== */
(function () {
  'use strict';

  var kontener = document.getElementById('mapa-gminy');
  if (!kontener) return; /* nie jesteśmy na /mapa — nic nie ładujemy */

  var WERSJA_MAPLIBRE = '4.7.1';

  /* CDN: jsDelivr, NIE unpkg.
     Powód nie jest kwestią gustu. Nasza polityka CSP
     (src/middleware/security-headers.ts) wymienia w script-src i style-src
     wyłącznie 'self', cdn.jsdelivr.net i cdnjs.cloudflare.com. Przy adresie
     unpkg.com przeglądarka blokowała OBA pliki MapLibre, skrypt wpadał
     w gałąź onerror i mapa nie pojawiała się nigdy — a testy HTTP tego nie
     wykrywały, bo serwer zwracał poprawne 200 dla samej strony.
     Wersja przypięta na sztywno: podmiana biblioteki pod nami zmieniłaby
     wygląd i zachowanie mapy bez naszej wiedzy. */
  var CDN = 'https://cdn.jsdelivr.net/npm/maplibre-gl@' + WERSJA_MAPLIBRE + '/dist/';
  var STYL_PODKLADU = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
  var ADNOTACJA =
    '<a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener nofollow">' +
    '&copy; OpenStreetMap contributors</a> | ' +
    '<a href="https://carto.com/attributions" target="_blank" rel="noopener nofollow">&copy; CARTO</a>';

  var ladowanie = document.getElementById('mapa-ladowanie');

  /* Komunikat o błędzie wstawiany do kontenera mapy.
     Ważne: mówimy wprost, że lista pod mapą zawiera te same sołectwa.
     Sam napis „nie udało się wczytać mapy" zostawiłby czytelnika
     w przekonaniu, że informacja jest niedostępna — a jest, niżej. */
  function pokazBlad(tekst) {
    if (!ladowanie) return;
    ladowanie.textContent = '';
    var p = document.createElement('p');
    p.className = 'mapa-blad-tekst';
    p.setAttribute('role', 'status');
    p.textContent = tekst + ' Pełna lista sołectw znajduje się pod mapą.';
    ladowanie.appendChild(p);
    ladowanie.classList.add('mapa-ladowanie--blad');
  }

  function wczytajStyl(url) {
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }

  function wczytajSkrypt(url) {
    return new Promise(function (spelnij, odrzuc) {
      var s = document.createElement('script');
      s.src = url;
      s.async = true;
      s.onload = spelnij;
      s.onerror = function () {
        odrzuc(new Error('Nie udało się wczytać ' + url));
      };
      document.head.appendChild(s);
    });
  }

  function pobierzPunkty() {
    var endpoint = kontener.getAttribute('data-endpoint') || '/api/v1/mapa/solectwa';
    return fetch(endpoint, { headers: { accept: 'application/json' } })
      .then(function (odp) {
        if (!odp.ok) throw new Error('HTTP ' + odp.status);
        return odp.json();
      })
      .then(function (koperta) {
        /* Koperta odpowiedzi z etapu A3: { ok, data, requestId }.
           Czytamy `data`, a nie korzeń — inaczej po dodaniu pola
           w kopercie mapa przestałaby widzieć punkty. */
        var dane = koperta && koperta.ok === true ? koperta.data : null;
        if (!dane || !Array.isArray(dane.punkty) || dane.punkty.length === 0) {
          throw new Error('Brak punktów w odpowiedzi');
        }
        return dane;
      });
  }

  /* Znacznik budowany z elementów DOM, nie z innerHTML.
     Nazwa sołectwa i nazwisko sołtysa pochodzą z bazy danych, którą
     wypełnia redakcja — czyli z treści wprowadzanej przez człowieka.
     Wstawianie jej jako HTML byłoby drogą do XSS przez panel redakcyjny. */
  function zbudujZnacznik(punkt) {
    var el = document.createElement('button');
    el.type = 'button';
    el.className = 'mapa-znacznik' + (punkt.jestSiedziba ? ' mapa-znacznik--siedziba' : '');
    /* Znacznik jako <button>, nie <div>: musi być osiągalny klawiaturą
       i ogłaszany przez czytnik ekranu jako element interaktywny (WCAG 2.1.1). */
    el.setAttribute(
      'aria-label',
      punkt.jestSiedziba
        ? punkt.nazwa + ' — siedziba gminy'
        : 'Sołectwo ' + punkt.nazwa
    );
    var kropka = document.createElement('span');
    kropka.className = 'mapa-znacznik-kropka';
    kropka.setAttribute('aria-hidden', 'true');
    el.appendChild(kropka);

    var etykieta = document.createElement('span');
    etykieta.className = 'mapa-znacznik-etykieta';
    etykieta.textContent = punkt.nazwa;
    el.appendChild(etykieta);
    return el;
  }

  function zbudujDymek(punkt) {
    var box = document.createElement('div');
    box.className = 'mapa-dymek';

    var tytul = document.createElement('strong');
    tytul.className = 'mapa-dymek-tytul';
    tytul.textContent = punkt.nazwa;
    box.appendChild(tytul);

    if (punkt.jestSiedziba) {
      var znacznikSiedziby = document.createElement('span');
      znacznikSiedziby.className = 'mapa-dymek-siedziba';
      znacznikSiedziby.textContent = 'siedziba gminy';
      box.appendChild(znacznikSiedziby);
    }

    /* Sołtys pokazywany TYLKO gdy jest w bazie. Brak wpisu to brak
       wiersza, a nie „sołtys: —": puste pole wygląda jak błąd systemu,
       podczas gdy w rzeczywistości redakcja jeszcze nie uzupełniła danych. */
    if (punkt.soltys) {
      var soltys = document.createElement('p');
      soltys.className = 'mapa-dymek-soltys';
      soltys.textContent = 'Sołtys: ' + punkt.soltys;
      box.appendChild(soltys);
    }

    var link = document.createElement('a');
    link.className = 'mapa-dymek-link';
    link.href = punkt.adres;
    link.textContent =
      punkt.liczbaMaterialow > 0
        ? 'Materiały (' + punkt.liczbaMaterialow + ') \u2192'
        : 'Otwórz stronę sołectwa \u2192';
    box.appendChild(link);
    return box;
  }

  function narysuj(dane) {
    var ml = window.maplibregl;
    if (!ml) {
      pokazBlad('Biblioteka mapy nie została wczytana.');
      return;
    }

    var mapa = new ml.Map({
      container: 'mapa-gminy',
      style: STYL_PODKLADU,
      attributionControl: false, /* własna kontrolka poniżej — z pełną adnotacją ODbL */
      /* `bounds` z odpowiedzi API, nie wpisane na stałe: zakres jest
         wyliczany z faktycznych współrzędnych punktów, więc po dodaniu
         sołectwa mapa sama obejmie nowy obszar.

         UWAGA — nazwy pól. Trasa /api/v1/mapa/solectwa zwraca zakres jako
         { poludnie, polnoc, zachod, wschod }, a NIE { latMin, lonMin, … }.
         Wcześniejsza wersja tego pliku czytała nazwy `latMin`/`lonMin`,
         których w odpowiedzi nie ma — konstruktor MapLibre otrzymywał
         [[undefined, undefined], …] i mapa kończyła się wyjątkiem, zanim
         cokolwiek narysowała. Sprawdzone na żywej odpowiedzi API.

         Zapis jest [[zachód, południe], [wschód, północ]], bo MapLibre
         przyjmuje kolejność [longitude, latitude] — odwrotną niż potoczne
         „szerokość, długość". */
      bounds: [
        [dane.zakres.zachod, dane.zakres.poludnie],
        [dane.zakres.wschod, dane.zakres.polnoc],
      ],
      fitBoundsOptions: { padding: 48 },
      /* Kółko myszy przewija stronę, nie przybliża mapę — mapa jest
         w środku długiego dokumentu i przechwytywanie kółka uwięziłoby
         czytelnika przewijającego stronę. Przybliżanie: przyciski +/−,
         Ctrl+kółko oraz uszczypnięcie na telefonie. */
      scrollZoom: false,
      cooperativeGestures: true,
    });

    mapa.addControl(new ml.NavigationControl({ showCompass: false }), 'top-right');
    mapa.addControl(new ml.AttributionControl({ compact: false, customAttribution: ADNOTACJA }));
    mapa.addControl(new ml.FullscreenControl(), 'top-right');

    mapa.on('load', function () {
      if (ladowanie && ladowanie.parentNode) ladowanie.parentNode.removeChild(ladowanie);

      dane.punkty.forEach(function (p) {
        if (typeof p.lat !== 'number' || typeof p.lon !== 'number') return;
        new ml.Marker({ element: zbudujZnacznik(p), anchor: 'bottom' })
          .setLngLat([p.lon, p.lat])
          .setPopup(
            new ml.Popup({ offset: 18, closeButton: true, maxWidth: '260px' }).setDOMContent(
              zbudujDymek(p)
            )
          )
          .addTo(mapa);
      });
    });

    mapa.on('error', function (e) {
      /* Błędy pojedynczych kafli nie mogą kasować całej mapy — logujemy
         i idziemy dalej. Konsola wystarczy: czytelnika nie interesuje,
         że jeden kwadrat podkładu się nie wczytał. */
      /* Wyciągamy TEKST błędu, nie sam obiekt. MapLibre podaje w zdarzeniu
         obiekt Error, a przeglądarka wypisywała go jako samo „Error”
         bez treści — log był bezużyteczny przy diagnozie. Dokładamy też
         adres kafla (e.sourceId / e.tile), bo bez niego nie wiadomo,
         który fragment podkładu zawiódł. */
      if (window.console && console.warn) {
        var blad = e && e.error ? e.error : e;
        var tresc = (blad && (blad.message || blad.statusText)) || String(blad);
        var status = blad && blad.status ? ' [HTTP ' + blad.status + ']' : '';
        var zrodlo = e && e.sourceId ? ' zrodlo=' + e.sourceId : '';
        console.warn('[mapa] ' + tresc + status + zrodlo);
      }
    });

    /* Powiązanie listy pod mapą z mapą: kliknięcie karty sołectwa
       przy wciśniętym klawiszu nie nawiguje, a centruje mapę.
       Zwykłe kliknięcie nadal otwiera stronę sołectwa — link musi
       działać jak link, bo tego oczekuje użytkownik i robot. */
    var indeks = {};
    dane.punkty.forEach(function (p) {
      indeks[p.slug] = p;
    });
    document.querySelectorAll('[data-solectwo]').forEach(function (karta) {
      karta.addEventListener('click', function (ev) {
        if (!ev.altKey) return;
        var p = indeks[karta.getAttribute('data-solectwo')];
        if (!p) return;
        ev.preventDefault();
        mapa.flyTo({ center: [p.lon, p.lat], zoom: 13 });
        kontener.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });
  }

  /* Kolejność: styl (nieblokujący) → skrypt i dane równolegle.
     Punkty pobieramy jednocześnie z biblioteką, bo to dwa niezależne
     żądania — czekanie na nie po kolei podwoiłoby czas do wyświetlenia. */
  wczytajStyl(CDN + 'maplibre-gl.css');

  Promise.all([wczytajSkrypt(CDN + 'maplibre-gl.js'), pobierzPunkty()])
    .then(function (wyniki) {
      narysuj(wyniki[1]);
    })
    .catch(function (err) {
      if (window.console && console.warn) console.warn('[mapa]', err);
      pokazBlad('Nie udało się wczytać mapy interaktywnej.');
    });
})();

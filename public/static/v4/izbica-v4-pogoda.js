/* ==========================================================================
   IZBICA24.PL — POGODA W PASKU GÓRNYM  (etap I5)

   Dlaczego osobny plik, a nie dopisek do izbica-v4.js:
   izbica-v4.js jest ładowany z atrybutem `defer`, czyli po sparsowaniu
   całego dokumentu. Pasek pogodowy jest pierwszym elementem strony, więc
   im wcześniej się uzupełni, tym mniejszy przeskok układu. Osobny mały
   plik (~2 kB) można wczytać niezależnie od 15 kB reszty skryptów.

   Dlaczego pobranie w przeglądarce, a nie renderowanie na serwerze:
   komponent `Shell` jest używany w ~20 trasach jako funkcja synchroniczna.
   Pobranie pogody serwerowo wymagałoby `await` w każdej z tych tras i
   dokładałoby odczyt KV (a przy zimnej pamięci — żądanie do Open-Meteo)
   do czasu odpowiedzi KAŻDEJ podstrony, także artykułu. Pasek jest
   elementem informacyjnym drugiego planu — nie warto płacić za niego
   opóźnieniem pierwszego bajtu na całym portalu.

   Czego ten plik NIE robi: nie wpisuje wartości zastępczej. Do niedawna
   w tym miejscu widniało „18°C" wpisane na stałe w szablonie — liczba
   nieprawdziwa i niezmienna. Przy awarii dostawcy kontener zostaje pusty.
   Lepiej nie pokazać nic niż podać zmyśloną temperaturę: mieszkaniec
   podejmuje na jej podstawie decyzje (czy zabrać kurtkę, czy kosić).
   ========================================================================== */
(function () {
  'use strict';

  var kontener = document.getElementById('topbar-pogoda');
  if (!kontener) return;

  var endpoint = kontener.getAttribute('data-endpoint') || '/api/v1/pogoda/pasek';

  /* Ikony jako inline SVG — te same ścieżki, co w komponencie serwerowym
     PogodaWidget.tsx. Nie używamy Font Awesome, bo pasek jest na każdej
     podstronie, a przy zablokowanym CDN ikon (filtry treści w szkołach,
     blokery reklam) zostałby przy temperaturze pusty prostokąt. */
  var IKONY = {
    sun: 'M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6l1.4 1.4M17 17l1.4 1.4M18.4 5.6L17 7M7 17l-1.4 1.4',
    'cloud-sun': 'M4 15h11a3 3 0 100-6 5 5 0 00-9.6 1.5A2.75 2.75 0 004 15z',
    cloud: 'M6 17h11a3.5 3.5 0 100-7 5.5 5.5 0 00-10.6 1.6A2.9 2.9 0 006 17z',
    'cloud-rain':
      'M6 14h11a3.5 3.5 0 100-7 5.5 5.5 0 00-10.6 1.6A2.9 2.9 0 006 14zM8 18v2M12 18v2.5M16 18v2',
    'cloud-snow':
      'M6 14h11a3.5 3.5 0 100-7 5.5 5.5 0 00-10.6 1.6A2.9 2.9 0 006 14zM9 18h.01M13 19h.01M16 18h.01',
    'cloud-lightning':
      'M6 14h11a3.5 3.5 0 100-7 5.5 5.5 0 00-10.6 1.6A2.9 2.9 0 006 14zM13 15l-3 5h3l-1 3',
    fog: 'M3 9h18M3 13h18M5 17h14',
    drizzle: 'M6 14h11a3.5 3.5 0 100-7 5.5 5.5 0 00-10.6 1.6A2.9 2.9 0 006 14zM9 18v1.5M13 18v1.5',
  };

  /* Budowa węzłów przez DOM API, nie przez innerHTML.
     Nazwa lokalizacji i opis pogody pochodzą z odpowiedzi HTTP — nawet
     jeśli dziś to nasz własny endpoint, wstawianie ciągów z sieci jako
     HTML jest wzorcem, który przy kolejnej zmianie źródła zamienia się
     w podatność XSS. `textContent` nie interpretuje znaczników. */
  function zbudujIkone(nazwaIkony) {
    var NS = 'http://www.w3.org/2000/svg';
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 24 24');
    svg.setAttribute('fill', 'none');
    svg.setAttribute('stroke', 'currentColor');
    svg.setAttribute('stroke-width', '1.7');
    svg.setAttribute('stroke-linecap', 'round');
    svg.setAttribute('aria-hidden', 'true');
    svg.setAttribute('focusable', 'false');

    if (nazwaIkony === 'sun' || nazwaIkony === 'cloud-sun') {
      var okrag = document.createElementNS(NS, 'circle');
      var slonce = nazwaIkony === 'sun';
      okrag.setAttribute('cx', slonce ? '12' : '17');
      okrag.setAttribute('cy', slonce ? '12' : '7');
      okrag.setAttribute('r', slonce ? '4' : '2.5');
      svg.appendChild(okrag);
    }

    var sciezka = document.createElementNS(NS, 'path');
    sciezka.setAttribute('d', IKONY[nazwaIkony] || IKONY.cloud);
    svg.appendChild(sciezka);
    return svg;
  }

  function pokaz(dane) {
    /* `dostepne: false` to prawidłowa odpowiedź serwera, nie błąd:
       oznacza „dostawca milczy i nie mam nawet starych danych". */
    if (!dane || dane.dostepne !== true || typeof dane.temperatura !== 'number') return;

    kontener.textContent = '';
    kontener.appendChild(zbudujIkone(dane.ikona));

    var opis = document.createElement('span');
    opis.textContent = ' ' + dane.temperatura + '\u00B0C \u00B7 ' + (dane.lokalizacja || '');
    kontener.appendChild(opis);

    /* Pełne dane w atrybucie `title` — kierunek wiatru i źródło nie mieszczą
       się w pasku, ale podanie źródła jest warunkiem licencji CC-BY 4.0
       Open-Meteo, więc musi być gdzieś dostępne bez wchodzenia na /pogoda. */
    var czesci = [];
    if (dane.opis) czesci.push(dane.opis);
    if (typeof dane.wiatr === 'number') {
      czesci.push('wiatr ' + dane.wiatr + ' km/h' + (dane.kierunek ? ' ' + dane.kierunek : ''));
    }
    if (dane.zrodlo) czesci.push('\u017Ar\u00F3d\u0142o: ' + dane.zrodlo);
    if (czesci.length) kontener.setAttribute('title', czesci.join(' \u00B7 '));

    if (dane.nieswieze === true) kontener.classList.add('pogoda-stara');
  }

  /* Bez `catch`, który pokazuje komunikat: awaria pogody nie może wyglądać
     jak awaria portalu. Cicha porażka jest tu właściwym zachowaniem —
     komunikat o problemie z dostawcą należy do podstrony /pogoda. */
  try {
    fetch(endpoint, { headers: { accept: 'application/json' } })
      .then(function (odp) {
        return odp.ok ? odp.json() : null;
      })
      .then(pokaz)
      .catch(function () {});
  } catch (e) {
    /* starsze przeglądarki bez fetch — pasek zostaje bez pogody */
  }
})();

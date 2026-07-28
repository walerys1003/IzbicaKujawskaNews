/*
  Klient powiadomień push — strona przeglądarki.

  ZMIERZONE DEFEKTY POPRZEDNIEJ WERSJI (2026-07-28)
  --------------------------------------------------
  1. `fetch('/api/push/vapid-public-key').then(r => r.json())` bez sprawdzenia
     `r.ok`. Trasa zwraca 503 z ciałem {error:'push_not_configured'}, gdy
     w środowisku nie ma VAPID_PUBLIC_KEY — co potwierdziłem curlem. Wtedy
     `vapid.publicKey` był `undefined`, a `atob(undefined + '=')` rzucał
     InvalidCharacterError. Czytelnik widział przycisk, który po kliknięciu
     odblokowywał się bez żadnego komunikatu — bez otwartej konsoli nie
     istniał sposób, by dowiedzieć się, że push nie jest skonfigurowany.

  2. Brak sprawdzenia Notification.permission. Gdy czytelnik wcześniej
     odrzucił zgodę, `pushManager.subscribe()` odrzuca obietnicę natychmiast,
     a przycisk tylko migał — bez wyjaśnienia, że decyzję trzeba odwołać
     w ustawieniach przeglądarki, bo strona nie może o nią zapytać ponownie.

  3. Brak stanu „już zasubskrybowany". Ponowne wejście na stronę pokazywało
     przycisk „Włącz powiadomienia" komuś, kto je już ma — kliknięcie
     tworzyło duplikat po stronie serwera.

  4. Rejestracja /sw.js, gdy renderer rejestrował /static/sw.js — dwa różne
     Service Workery o różnych zakresach (opis w public/sw.js).
*/
(() => {
  const SCIEZKA_SW = '/sw.js'
  const SELEKTOR = '[data-push-subscribe]'

  const doBajtow = (base64) => {
    const dopelnione = `${base64}${'='.repeat((4 - (base64.length % 4)) % 4)}`.replace(/-/g, '+').replace(/_/g, '/')
    const binarne = atob(dopelnione)
    const bajty = new Uint8Array(binarne.length)
    for (let i = 0; i < binarne.length; i += 1) bajty[i] = binarne.charCodeAt(i)
    return bajty
  }

  const wspierane = () => 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

  const rejestracja = async () => {
    if (!wspierane()) return null
    /*
      getRegistration() zamiast register(): renderer rejestruje /sw.js przy
      wczytaniu strony, więc worker zwykle już istnieje. Ponowne register()
      jest nieszkodliwe, ale ready() gwarantuje, że worker jest AKTYWNY —
      subscribe() na workerze w stanie "installing" odrzuca obietnicę.
    */
    await navigator.serviceWorker.register(SCIEZKA_SW).catch(() => undefined)
    return navigator.serviceWorker.ready
  }

  const pobierzKluczSerwera = async () => {
    const odp = await fetch('/api/push/vapid-public-key')
    if (!odp.ok) {
      /* 503 = brak VAPID_PUBLIC_KEY w środowisku. Rozróżniam to od błędu sieci. */
      const powod = odp.status === 503 ? 'nieskonfigurowane' : 'blad_serwera'
      throw Object.assign(new Error('Brak klucza VAPID'), { powod })
    }
    const dane = await odp.json()
    if (!dane || typeof dane.publicKey !== 'string' || dane.publicKey.length === 0) {
      throw Object.assign(new Error('Odpowiedź bez klucza publicznego'), { powod: 'nieskonfigurowane' })
    }
    return dane.publicKey
  }

  const zapiszNaSerwerze = async (subskrypcja) => {
    const odp = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        endpoint: subskrypcja.endpoint,
        keys: subskrypcja.toJSON().keys || {},
        categories: ['wiadomosci'],
        segments: ['homepage'],
        locale: document.documentElement.lang || 'pl-PL',
      }),
    })
    if (!odp.ok) {
      throw Object.assign(new Error(`Serwer odrzucił subskrypcję (${odp.status})`), { powod: 'blad_serwera' })
    }
    return odp.json()
  }

  const zasubskrybuj = async () => {
    const rej = await rejestracja()
    if (!rej) throw Object.assign(new Error('Przeglądarka nie wspiera push'), { powod: 'niewspierane' })

    if (Notification.permission === 'denied') {
      throw Object.assign(new Error('Zgoda wcześniej odrzucona'), { powod: 'odrzucone' })
    }

    /* Klucz serwera pobieram PRZED prośbą o zgodę — nie ma sensu pytać
       czytelnika o pozwolenie, jeśli backend i tak nie potrafi wysłać. */
    const kluczPubliczny = await pobierzKluczSerwera()

    const istniejaca = await rej.pushManager.getSubscription()
    if (istniejaca) {
      /* Ponowny zapis jest bezpieczny: /api/push/subscribe robi upsert po id
         wyliczonym z endpointu, więc nie tworzy duplikatu. */
      await zapiszNaSerwerze(istniejaca)
      return { juzAktywne: true }
    }

    const zgoda = await Notification.requestPermission()
    if (zgoda !== 'granted') {
      throw Object.assign(new Error('Brak zgody'), { powod: 'odrzucone' })
    }

    const nowa = await rej.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: doBajtow(kluczPubliczny),
    })
    await zapiszNaSerwerze(nowa)
    return { juzAktywne: false }
  }

  const KOMUNIKATY = {
    niewspierane: 'Ta przeglądarka nie obsługuje powiadomień.',
    odrzucone: 'Powiadomienia zablokowane — zmień to w ustawieniach przeglądarki.',
    nieskonfigurowane: 'Powiadomienia chwilowo niedostępne.',
    blad_serwera: 'Nie udało się zapisać — spróbuj ponownie.',
  }

  const ustawStan = (przycisk, stan, tekst) => {
    przycisk.dataset.pushStan = stan
    przycisk.textContent = tekst
    /* Czytnik ekranu musi usłyszeć zmianę — sam textContent nie wywoła
       ogłoszenia, jeśli element nie jest obszarem live. */
    przycisk.setAttribute('aria-live', 'polite')
  }

  const podlacz = async (przycisk) => {
    /*
      Przycisk przychodzi z serwera z atrybutem `hidden` i to TEN kod go
      odsłania. Odwrotna kolejność (widoczny w HTML, ukrywany skryptem)
      dawałaby przebłysk martwego przycisku w przeglądarkach bez PushManager
      (Safari/iOS poza trybem PWA) i przeskok układu przy jego zniknięciu —
      czyli regres tego, co naprawialiśmy w etapie F4 (CLS).
    */
    if (!wspierane()) {
      przycisk.hidden = true
      return
    }
    przycisk.hidden = false

    /* Stan początkowy zależy od faktów, nie od założeń: pytam workera,
       czy subskrypcja już istnieje. */
    try {
      const rej = await navigator.serviceWorker.getRegistration(SCIEZKA_SW)
      const istniejaca = rej ? await rej.pushManager.getSubscription() : null
      if (istniejaca && Notification.permission === 'granted') {
        ustawStan(przycisk, 'aktywne', 'Powiadomienia włączone')
        przycisk.disabled = true
        return
      }
    } catch (blad) {
      /* Brak rejestracji to normalny stan pierwszej wizyty — nie loguję. */
    }

    przycisk.addEventListener('click', async () => {
      const pierwotny = przycisk.textContent
      przycisk.disabled = true
      ustawStan(przycisk, 'oczekiwanie', 'Włączanie…')
      try {
        const wynik = await zasubskrybuj()
        ustawStan(przycisk, 'aktywne', wynik.juzAktywne ? 'Powiadomienia włączone' : 'Powiadomienia włączone')
      } catch (blad) {
        const powod = blad && blad.powod ? blad.powod : 'blad_serwera'
        ustawStan(przycisk, 'blad', KOMUNIKATY[powod] || KOMUNIKATY.blad_serwera)
        console.error('[push-client]', powod, blad)
        /* Przy trwałej odmowie i braku konfiguracji ponowne kliknięcie nic
           nie zmieni — zostawiam przycisk wyłączony, żeby nie udawać, że da
           się coś zrobić. W pozostałych razach przywracam możliwość próby. */
        if (powod === 'blad_serwera') {
          window.setTimeout(() => {
            przycisk.disabled = false
            ustawStan(przycisk, 'gotowe', pierwotny)
          }, 4000)
        }
      }
    })
  }

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll(SELEKTOR).forEach((przycisk) => {
      void podlacz(przycisk)
    })
  })
})()

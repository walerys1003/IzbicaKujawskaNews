/*
  PLIK MIGRACYJNY — nie dopisuj tu logiki.

  Do 2026-07-28 ten plik był Service Workerem z warstwą cache. Miał jednak
  zakres /static/ (bo tak wynika z katalogu, a nagłówka Service-Worker-Allowed
  nigdzie nie ustawiano), więc nie kontrolował żadnej strony portalu i jego
  handler `fetch` nigdy nie był wywoływany. Cała warstwa offline była martwa.

  Warstwa cache i powiadomienia push mieszkają teraz w /sw.js (zakres /).

  Problem: czytelnicy, którzy odwiedzili portal wcześniej, mają w przeglądarce
  ZAPISANĄ rejestrację tego pliku. Sama zmiana rejestracji w HTML jej nie
  usuwa — stary worker zostałby na zawsze obok nowego. Dlatego ten skrypt
  wyrejestrowuje sam siebie i sprząta cache po wersjach v3/v4.

  Plik można usunąć, gdy telemetria pokaże brak rejestracji o zakresie
  /static/ — czyli po okresie dłuższym niż typowa przerwa między wizytami
  stałego czytelnika. Usunięcie go za wcześnie da 404, a wtedy przeglądarka
  zostawi starą rejestrację w spokoju i migracja nigdy się nie dokończy.
*/

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const klucze = await caches.keys()
      await Promise.all(klucze.filter((klucz) => klucz.startsWith('izbica24-')).map((klucz) => caches.delete(klucz)))
      await self.registration.unregister()

      /*
        Po unregister() strony pozostają kontrolowane przez tego workera do
        następnego przeładowania. Wymuszam je, żeby czytelnik od razu trafił
        pod kontrolę /sw.js, a nie dopiero przy kolejnej wizycie.
      */
      const okna = await self.clients.matchAll({ type: 'window' })
      okna.forEach((okno) => okno.navigate(okno.url))
    })()
  )
})

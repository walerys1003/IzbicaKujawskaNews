/*
  Generator pary kluczy VAPID (RFC 8292) dla powiadomień push.

  Uruchomienie:  node scripts/generuj-klucze-vapid.mjs

  Używa wyłącznie Web Crypto (globalThis.crypto.subtle) — tej samej ścieżki,
  której używa src/lib/push/webpush.ts w środowisku Cloudflare Workers.
  Dzięki temu wygenerowany tu klucz jest gwarantowanie zdatny do użycia
  przez kod produkcyjny: gdyby format się różnił, podpis VAPID nie
  przeszedłby weryfikacji u dostawcy (FCM zwraca wtedy 401).

  UWAGA — klucz prywatny NIE trafia do wrangler.jsonc ani do repozytorium.
  Skrypt drukuje go na standardowe wyjście, żeby wkleić go do:

      npx wrangler pages secret put VAPID_PRIVATE_KEY --project-name <projekt>

  Klucz publiczny jest jawny (trafia do przeglądarki czytelnika przy
  subskrypcji), więc może stać w konfiguracji jako zwykła zmienna.
*/

const doBase64Url = (bajty) =>
  Buffer.from(bajty).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

const para = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])

/*
  Klucz publiczny w formacie 'raw' = 65 bajtów zaczynających się od 0x04
  (punkt niekompresowany). Dokładnie tego oczekuje przeglądarka w polu
  applicationServerKey.
*/
const publiczny = new Uint8Array(await crypto.subtle.exportKey('raw', para.publicKey))

/*
  Klucz prywatny eksportuję jako 'jwk' i biorę składową d (32 bajty).
  Format pkcs8 też by działał, ale d jest tym, co przyjmuje
  importKluczaPrywatnego() w src/lib/push/webpush.ts.
*/
const jwk = await crypto.subtle.exportKey('jwk', para.privateKey)

if (publiczny.length !== 65 || publiczny[0] !== 0x04) {
  console.error('Blad: klucz publiczny nie ma formatu 65-bajtowego punktu niekompresowanego.')
  process.exit(1)
}

console.log('')
console.log('Klucze VAPID wygenerowane. Publiczny jest jawny, prywatny to SEKRET.')
console.log('')
console.log('VAPID_PUBLIC_KEY  =', doBase64Url(publiczny))
console.log('VAPID_PRIVATE_KEY =', jwk.d)
console.log('VAPID_SUBJECT     = mailto:redakcja@izbica24.pl   # zmien na realny adres')
console.log('')
console.log('Wdrozenie (klucz prywatny NIGDY do wrangler.jsonc ani do gita):')
console.log('  npx wrangler pages secret put VAPID_PRIVATE_KEY --project-name <projekt>')
console.log('  npx wrangler pages secret put VAPID_PUBLIC_KEY  --project-name <projekt>')
console.log('  npx wrangler pages secret put VAPID_SUBJECT     --project-name <projekt>')
console.log('')
console.log('Lokalnie: wpisz te trzy linie do pliku .dev.vars (jest w .gitignore).')
console.log('')

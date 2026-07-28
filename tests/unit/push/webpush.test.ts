import { describe, expect, it } from 'vitest'
import {
  doBase64Url,
  zBase64Url,
  zaszyfrujLadunek,
  zbudujNaglowekVapid,
  wygenerujKluczeVapid,
  wyslijPowiadomienie,
  kluczeVapidZeSrodowiska,
} from '../../../src/lib/push/webpush'

/**
 * I8 — DOWÓD POPRAWNOŚCI WARSTWY SZYFROWANIA
 *
 * Kryptografii nie da się sprawdzić „na oko": błędny szyfrogram wygląda
 * dokładnie jak poprawny, a przeglądarka odrzuca go BEZ ŻADNEGO KOMUNIKATU.
 * Test typu „funkcja zwróciła jakieś bajty" przechodziłby przy odwróconej
 * kolejności kluczy w `key_info`, złym ograniczniku dopełnienia i pomylonym
 * `Content-Encoding` — czyli przy każdej z awarii, które faktycznie psują
 * wysyłkę.
 *
 * Dlatego sprawdzamy przeciwko OFICJALNEMU WEKTOROWI TESTOWEMU z RFC 8291
 * §5 wraz z wartościami pośrednimi z Załącznika A. Wektor podaje obie pary
 * kluczy i sól, więc wynik jest w pełni deterministyczny i porównywalny
 * bajt po bajcie.
 *
 * Źródło: https://www.rfc-editor.org/rfc/rfc8291.txt
 */

// ── Dane wejściowe z RFC 8291 §5 / Appendix A ────────────────────────────
const RFC = {
  tresc: 'When I grow up, I want to be a watermelon',
  odbiorcaKluczPubliczny: 'BCVxsr7N_eNgVRqvHtD0zTZsEc6-VV-JvLexhqUzORcxaOzi6-AYWXvTBHm4bjyPjs7Vd8pZGH6SRpkNtoIAiw4',
  sekretAuth: 'BTBZMqHH6r4Tts7J_aSIgg',
  nadawcaKluczPrywatny: 'yfWPiYE-n46HLnH0KqZOF1fJJU3MYrct3AELtAQ-oRw',
  nadawcaKluczPubliczny: 'BP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A8',
  sol: 'DGv6ra1nlYgDCS1FRnbzlw',

  // Wartości pośrednie — Appendix A
  ecdhSecret: 'kyrL1jIIOHEzg3sM2ZWRHDRB62YACZhhSlknJ672kSs',
  prkKey: 'Snr3JMxaHVDXHWJn5wdC52WjpCtd2EIEGBykDcZW32k',
  ikm: 'S4lYMb_L0FxCeq0WhDx813KgSYqU26kOyzWUdsXYyrg',
  prk: '09_eUZGrsvxChDCGRCdkLiDXrReGOEVeSCdCcPBSJSc',
  cek: 'oIhVW04MRdy2XN9CiKLxTg',
  nonce: '4h_95klXJ5E_qnoN',

  // Kompletne ciało żądania z §5 (nagłówek 86 B + szyfrogram)
  pelnyLadunek:
    'DGv6ra1nlYgDCS1FRnbzlwAAEABBBP4z9KsN6nGRTbVYI_c7VJSPQTBtkgcy27mlmlMoZIIgDll6e3vCYLocInmYWAmS6TlzAC8wEqKK6PBru3jl7A_yl95bQpu6cVPTpK4Mqgkf1CXztLVBSt2Ks3oZwbuwXPXLWyouBWLVWGNWQexSgSxsj_Qulcy4a-fN',
}

describe('web push — szyfrowanie (RFC 8291)', () => {
  it('odtwarza wszystkie wartości pośrednie z wektora testowego RFC 8291', async () => {
    const wynik = await zaszyfrujLadunek(
      RFC.tresc,
      { p256dh: RFC.odbiorcaKluczPubliczny, auth: RFC.sekretAuth },
      {
        kluczPrywatnySerwera: RFC.nadawcaKluczPrywatny,
        kluczPublicznySerwera: RFC.nadawcaKluczPubliczny,
        sol: RFC.sol,
      },
    )

    // Każda z tych wartości jest osobnym krokiem wyprowadzenia. Sprawdzamy je
    // pojedynczo, bo przy porównaniu wyłącznie końcowego ładunku awaria nie
    // wskazywałaby, KTÓRY krok się rozjechał.
    expect(wynik.posrednie.ecdhSecret).toBe(RFC.ecdhSecret)
    expect(wynik.posrednie.prkKey).toBe(RFC.prkKey)
    expect(wynik.posrednie.ikm).toBe(RFC.ikm)
    expect(wynik.posrednie.prk).toBe(RFC.prk)
    expect(wynik.posrednie.cek).toBe(RFC.cek)
    expect(wynik.posrednie.nonce).toBe(RFC.nonce)
  })

  it('produkuje ładunek identyczny bajt po bajcie z RFC 8291 §5', async () => {
    const wynik = await zaszyfrujLadunek(
      RFC.tresc,
      { p256dh: RFC.odbiorcaKluczPubliczny, auth: RFC.sekretAuth },
      {
        kluczPrywatnySerwera: RFC.nadawcaKluczPrywatny,
        kluczPublicznySerwera: RFC.nadawcaKluczPubliczny,
        sol: RFC.sol,
      },
    )

    expect(doBase64Url(wynik.cialo)).toBe(RFC.pelnyLadunek)

    // Struktura długości — liczona z danych, nie ze stałej wpisanej „na oko".
    // Pierwsza wersja tej asercji miała 40 zamiast 41 znaków treści (błąd
    // mojego ręcznego zliczania) i padła, choć ładunek był POPRAWNY —
    // porównanie bajt po bajcie powyżej przeszło. Stąd wyliczenie z `.length`:
    // stała przepisana ręcznie jest kolejnym miejscem na pomyłkę.
    const NAGLOWEK_AES128GCM = 16 + 4 + 1 + 65 // sól + rozmiar rekordu + idlen + klucz
    const ZNACZNIK_GCM = 16
    const OGRANICZNIK_DOPELNIENIA = 1
    expect(RFC.tresc.length).toBe(41)
    expect(wynik.cialo.length).toBe(NAGLOWEK_AES128GCM + RFC.tresc.length + OGRANICZNIK_DOPELNIENIA + ZNACZNIK_GCM)
  })

  it('nagłówek aes128gcm zawiera sól, rozmiar rekordu 4096 i klucz serwera', async () => {
    const wynik = await zaszyfrujLadunek(
      RFC.tresc,
      { p256dh: RFC.odbiorcaKluczPubliczny, auth: RFC.sekretAuth },
      {
        kluczPrywatnySerwera: RFC.nadawcaKluczPrywatny,
        kluczPublicznySerwera: RFC.nadawcaKluczPubliczny,
        sol: RFC.sol,
      },
    )

    expect(doBase64Url(wynik.cialo.slice(0, 16))).toBe(RFC.sol)
    // Rozmiar rekordu zapisany jako 32-bitowa liczba big-endian.
    const rs = new DataView(wynik.cialo.buffer, wynik.cialo.byteOffset + 16, 4).getUint32(0, false)
    expect(rs).toBe(4096)
    expect(wynik.cialo[20]).toBe(65)
    expect(doBase64Url(wynik.cialo.slice(21, 86))).toBe(RFC.nadawcaKluczPubliczny)
  })

  /**
   * Bez ziarna każde wywołanie MUSI dać inny szyfrogram — nowa para efemeryczna
   * i nowa sól. Powtarzalny wynik oznaczałby, że sól albo klucz są stałe, co
   * pozwoliłoby powiązać wysyłki do tego samego odbiorcy (RFC 8291 §3.1).
   */
  it('bez ziarna generuje inny ładunek przy każdym wywołaniu', async () => {
    const klucze = { p256dh: RFC.odbiorcaKluczPubliczny, auth: RFC.sekretAuth }
    const pierwszy = await zaszyfrujLadunek(RFC.tresc, klucze)
    const drugi = await zaszyfrujLadunek(RFC.tresc, klucze)

    expect(doBase64Url(pierwszy.cialo)).not.toBe(doBase64Url(drugi.cialo))
    expect(pierwszy.posrednie.cek).not.toBe(drugi.posrednie.cek)
    // Długość pozostaje ta sama — różni się zawartość, nie struktura.
    expect(pierwszy.cialo.length).toBe(drugi.cialo.length)
  })

  it('odrzuca klucz publiczny o nieprawidłowej długości', async () => {
    await expect(
      zaszyfrujLadunek('test', { p256dh: doBase64Url(new Uint8Array(10)), auth: RFC.sekretAuth }),
    ).rejects.toThrow(/65 bajt/)
  })
})

describe('web push — VAPID (RFC 8292)', () => {
  it('buduje nagłówek z tokenem ES256 i kluczem publicznym', async () => {
    const klucze = await wygenerujKluczeVapid()
    const naglowek = await zbudujNaglowekVapid('https://fcm.googleapis.com/fcm/send/abc123', {
      publiczny: klucze.publiczny,
      prywatny: klucze.prywatny,
      kontakt: 'mailto:kontakt@izbica24.pl',
    })

    expect(naglowek).toMatch(/^vapid t=[\w-]+\.[\w-]+\.[\w-]+, k=[\w-]+$/)
    expect(naglowek).toContain(`k=${klucze.publiczny}`)
  })

  /**
   * `aud` musi być SAMYM originem endpointu. Pełny URL ze ścieżką powoduje
   * odrzucenie tokenu przez FCM (401) — a to widać dopiero na produkcji,
   * bo lokalnie nikt nie woła prawdziwego dostawcy.
   */
  it('ustawia aud na origin endpointu, bez ścieżki', async () => {
    const klucze = await wygenerujKluczeVapid()
    const naglowek = await zbudujNaglowekVapid('https://fcm.googleapis.com/fcm/send/dluga/sciezka/xyz', {
      publiczny: klucze.publiczny,
      prywatny: klucze.prywatny,
      kontakt: 'mailto:kontakt@izbica24.pl',
    })

    const token = naglowek.slice('vapid t='.length).split(',')[0]
    const ladunek = JSON.parse(new TextDecoder().decode(zBase64Url(token.split('.')[1])))

    expect(ladunek.aud).toBe('https://fcm.googleapis.com')
    expect(ladunek.aud).not.toContain('/fcm/send')
    expect(ladunek.sub).toBe('mailto:kontakt@izbica24.pl')
  })

  it('podpis jest weryfikowalny kluczem publicznym', async () => {
    const klucze = await wygenerujKluczeVapid()
    const naglowek = await zbudujNaglowekVapid('https://updates.push.services.mozilla.com/wpush/v2/abc', {
      publiczny: klucze.publiczny,
      prywatny: klucze.prywatny,
      kontakt: 'mailto:kontakt@izbica24.pl',
    })

    const token = naglowek.slice('vapid t='.length).split(',')[0]
    const [naglowekJwt, ladunekJwt, podpis] = token.split('.')

    const surowy = zBase64Url(klucze.publiczny)
    const kluczWeryfikujacy = await crypto.subtle.importKey(
      'jwk',
      {
        kty: 'EC',
        crv: 'P-256',
        x: doBase64Url(surowy.slice(1, 33)),
        y: doBase64Url(surowy.slice(33, 65)),
        ext: true,
      },
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify'],
    )

    const poprawny = await crypto.subtle.verify(
      { name: 'ECDSA', hash: 'SHA-256' },
      kluczWeryfikujacy,
      zBase64Url(podpis) as BufferSource,
      new TextEncoder().encode(`${naglowekJwt}.${ladunekJwt}`) as BufferSource,
    )

    expect(poprawny).toBe(true)
  })

  it('token wygasa w granicy dopuszczonej przez RFC 8292 (max 24 h)', async () => {
    const klucze = await wygenerujKluczeVapid()
    const teraz = Math.floor(Date.now() / 1000)
    const naglowek = await zbudujNaglowekVapid(
      'https://fcm.googleapis.com/fcm/send/abc',
      { publiczny: klucze.publiczny, prywatny: klucze.prywatny, kontakt: 'mailto:a@b.pl' },
      teraz,
    )

    const token = naglowek.slice('vapid t='.length).split(',')[0]
    const ladunek = JSON.parse(new TextDecoder().decode(zBase64Url(token.split('.')[1])))

    expect(ladunek.exp).toBeGreaterThan(teraz)
    expect(ladunek.exp - teraz).toBeLessThanOrEqual(24 * 60 * 60)
  })
})

describe('web push — wysyłka i obsługa błędów', () => {
  const kluczeTestowe = { publiczny: '', prywatny: '', kontakt: 'mailto:kontakt@izbica24.pl' }
  const subskrypcja = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/abc123',
    keys: { p256dh: RFC.odbiorcaKluczPubliczny, auth: RFC.sekretAuth },
  }

  const zPodmienionymFetch = async <T>(odpowiedz: Response | Error, akcja: () => Promise<T>): Promise<{ wynik: T; zadania: Request[] }> => {
    const oryginalny = globalThis.fetch
    const zadania: Request[] = []
    globalThis.fetch = (async (wejscie: RequestInfo | URL, init?: RequestInit) => {
      zadania.push(new Request(wejscie as never, init))
      if (odpowiedz instanceof Error) throw odpowiedz
      return odpowiedz.clone()
    }) as typeof fetch
    try {
      return { wynik: await akcja(), zadania }
    } finally {
      globalThis.fetch = oryginalny
    }
  }

  const swiezeKlucze = async () => {
    const para = await wygenerujKluczeVapid()
    return { ...kluczeTestowe, publiczny: para.publiczny, prywatny: para.prywatny }
  }

  it('wysyła żądanie z prawidłowymi nagłówkami i zgłasza dostarczenie', async () => {
    const klucze = await swiezeKlucze()
    const { wynik, zadania } = await zPodmienionymFetch(new Response('', { status: 201 }), () =>
      wyslijPowiadomienie(subskrypcja, JSON.stringify({ title: 'Test' }), klucze),
    )

    expect(wynik.dostarczone).toBe(true)
    expect(wynik.status).toBe(201)
    expect(wynik.doUsuniecia).toBe(false)

    expect(zadania).toHaveLength(1)
    expect(zadania[0].method).toBe('POST')
    expect(zadania[0].headers.get('content-encoding')).toBe('aes128gcm')
    expect(zadania[0].headers.get('authorization')).toMatch(/^vapid t=/)
    expect(zadania[0].headers.get('ttl')).toBeTruthy()
  })

  /**
   * NAJWAŻNIEJSZY PRZYPADEK TEGO ZESTAWU.
   * Poprzedni `sendMessage` zapisywał `status:'sent'` i `delivered:N` bez
   * jakiegokolwiek żądania HTTP. Ten test wymusza, by odmowa dostawcy była
   * raportowana jako NIEDOSTARCZONE — inaczej panel znów pokazywałby fikcję.
   */
  it('nie zgłasza dostarczenia, gdy dostawca odrzuca żądanie', async () => {
    const klucze = await swiezeKlucze()
    const { wynik } = await zPodmienionymFetch(new Response('bad auth', { status: 401 }), () =>
      wyslijPowiadomienie(subskrypcja, 'x', klucze),
    )

    expect(wynik.dostarczone).toBe(false)
    expect(wynik.powod).toBe('odrzucone_uwierzytelnienie')
    expect(wynik.doUsuniecia).toBe(false)
  })

  it.each([404, 410])('oznacza subskrypcję do usunięcia przy HTTP %i', async (status) => {
    const klucze = await swiezeKlucze()
    const { wynik } = await zPodmienionymFetch(new Response('', { status }), () =>
      wyslijPowiadomienie(subskrypcja, 'x', klucze),
    )

    expect(wynik.dostarczone).toBe(false)
    expect(wynik.doUsuniecia).toBe(true)
    expect(wynik.powod).toBe('wygasla_subskrypcja')
  })

  it('rozpoznaje limit dostawcy (429) i nie usuwa subskrypcji', async () => {
    const klucze = await swiezeKlucze()
    const { wynik } = await zPodmienionymFetch(new Response('slow down', { status: 429 }), () =>
      wyslijPowiadomienie(subskrypcja, 'x', klucze),
    )

    expect(wynik.powod).toBe('limit_dostawcy')
    expect(wynik.doUsuniecia).toBe(false)
  })

  it('awaria sieci nie jest raportowana jako dostarczenie', async () => {
    const klucze = await swiezeKlucze()
    const { wynik } = await zPodmienionymFetch(new Error('ECONNRESET'), () =>
      wyslijPowiadomienie(subskrypcja, 'x', klucze),
    )

    expect(wynik.dostarczone).toBe(false)
    expect(wynik.powod).toBe('blad_sieci')
    expect(wynik.doUsuniecia).toBe(false)
  })

  it('subskrypcja bez kluczy jest odrzucana bez wysyłki', async () => {
    const klucze = await swiezeKlucze()
    const oryginalny = globalThis.fetch
    let wolanoFetch = false
    globalThis.fetch = (async () => {
      wolanoFetch = true
      return new Response('', { status: 201 })
    }) as typeof fetch

    try {
      const wynik = await wyslijPowiadomienie(
        { endpoint: subskrypcja.endpoint, keys: { p256dh: '', auth: '' } },
        'x',
        klucze,
      )
      expect(wynik.dostarczone).toBe(false)
      expect(wynik.doUsuniecia).toBe(true)
      expect(wolanoFetch).toBe(false)
    } finally {
      globalThis.fetch = oryginalny
    }
  })

  it('odrzuca zbyt duży ładunek przed wysłaniem żądania', async () => {
    const klucze = await swiezeKlucze()
    const oryginalny = globalThis.fetch
    let wolanoFetch = false
    globalThis.fetch = (async () => {
      wolanoFetch = true
      return new Response('', { status: 201 })
    }) as typeof fetch

    try {
      const wynik = await wyslijPowiadomienie(subskrypcja, 'x'.repeat(5000), klucze)
      expect(wynik.dostarczone).toBe(false)
      expect(wynik.powod).toBe('zbyt_duzy_ladunek')
      expect(wolanoFetch).toBe(false)
    } finally {
      globalThis.fetch = oryginalny
    }
  })
})

describe('web push — konfiguracja ze środowiska', () => {
  it('zwraca null przy niepełnej konfiguracji', () => {
    expect(kluczeVapidZeSrodowiska({})).toBeNull()
    expect(kluczeVapidZeSrodowiska({ VAPID_PUBLIC_KEY: 'abc' })).toBeNull()
    expect(kluczeVapidZeSrodowiska({ VAPID_PRIVATE_KEY: 'xyz' })).toBeNull()
  })

  it('zwraca klucze i domyślny kontakt, gdy oba sekrety są ustawione', () => {
    const klucze = kluczeVapidZeSrodowiska({ VAPID_PUBLIC_KEY: 'abc', VAPID_PRIVATE_KEY: 'xyz' })
    expect(klucze).toEqual({ publiczny: 'abc', prywatny: 'xyz', kontakt: 'mailto:kontakt@izbica24.pl' })
  })
})

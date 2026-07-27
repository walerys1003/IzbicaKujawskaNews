/**
 * Fakty o gminie Izbica Kujawska — jedno źródło prawdy.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * DLACZEGO TEN PLIK ISTNIEJE
 * ═══════════════════════════════════════════════════════════════════════
 * Liczby opisujące gminę były wpisane na sztywno w kilkunastu plikach:
 * „5 400 mieszkańców" w 7 miejscach, „147 km²" w 5, „34 sołectwa" w 6.
 * Wszystkie trzy były nieprawdziwe:
 *
 *   powierzchnia   147 km²  →  132,05 km²   (GUS/Wikipedia)
 *   mieszkańcy     5 400    →  7 688         (GUS, 30.06.2016)
 *   sołectwa       34       →  36 pozycji na liście podziału
 *
 * Portal informacyjny podający liczbę mieszkańców własnej gminy z błędem
 * ~30% traci wiarygodność w jednym zdaniu — to liczba, którą każdy
 * mieszkaniec zna z grubsza z pamięci. Rozproszenie po kilkunastu plikach
 * gwarantowało, że poprawka w jednym miejscu i tak zostawiłaby błąd
 * w pozostałych.
 *
 * ═══════════════════════════════════════════════════════════════════════
 * SKĄD DANE I CZEGO TU NIE MA
 * ═══════════════════════════════════════════════════════════════════════
 * Źródło: Wikipedia (pl) „Izbica Kujawska (gmina)" oraz „Izbica Kujawska",
 * oba oparte na danych GUS. Podajemy datę odniesienia przy każdej liczbie,
 * bo liczba ludności bez roku jest nieweryfikowalna.
 *
 * Liczby ludności poszczególnych sołectw NIE ma i nie zgadujemy jej.
 * `population` w tabeli `solectwa` zostaje NULL do czasu, gdy redakcja
 * wpisze dane z urzędu.
 */

export interface FaktGminy {
  wartosc: number
  /** Tekst do wyświetlenia — z polskim separatorem tysięcy. */
  tekst: string
  /** Data, na którą dana jest aktualna. Bez niej liczba jest nieweryfikowalna. */
  naDzien: string
  zrodlo: string
}

export const GMINA = {
  nazwa: 'Izbica Kujawska',
  dopelniacz: 'gminy Izbica Kujawska',
  rodzaj: 'gmina miejsko-wiejska',
  powiat: 'włocławski',
  wojewodztwo: 'kujawsko-pomorskie',
  teryt: '0418083',

  /** Współrzędne siedziby gminy — te same, których używa pogoda (I5) i mapa (I10). */
  wspolrzedne: { szerokosc: 52.4247, dlugosc: 18.7561 },

  /** Burmistrz — stanowisko obsadzone, nazwisko z Wikipedii. */
  burmistrz: 'Marek Dorabiała',
  adresUrzedu: 'ul. Piłsudskiego 32, 87-865 Izbica Kujawska',
  telefonKierunkowy: '54',
  tabliceRejestracyjne: 'CWL',
  stronaUrzedu: 'https://www.izbicakuj.pl',
  bip: 'https://www.bip.izbicakuj.pl/',

  powierzchnia: {
    wartosc: 132.05,
    tekst: '132 km²',
    naDzien: '2002',
    zrodlo: 'GUS / regioset.pl',
  } satisfies FaktGminy,

  ludnosc: {
    wartosc: 7688,
    tekst: '7 688',
    naDzien: '30.06.2016',
    zrodlo: 'GUS, Statystyczne Vademecum Samorządowca',
  } satisfies FaktGminy,

  /** Ludność samego miasta — osobna liczba, często mylona z ludnością gminy. */
  ludnoscMiasta: {
    wartosc: 2412,
    tekst: '2 412',
    naDzien: '01.01.2025',
    zrodlo: 'GUS',
  } satisfies FaktGminy,

  gestoscZaludnienia: 58.6,
} as const

/**
 * Liczba sołectw — wyliczana z listy, nigdy wpisana.
 *
 * Uwaga: infobox Wikipedii podaje „34", a wyliczona sekcja „Sołectwa"
 * zawiera 36 pozycji. Rozbieżność najpewniej dotyczy Błenny („Błenna",
 * „Błenna A", „Błenna B" — jedno sołectwo czy trzy). Nie rozstrzygamy
 * tego zgadywaniem: pokazujemy tyle pozycji, ile ich mamy z ustalonymi
 * współrzędnymi. Rozstrzygnięcie u źródła (statut gminy) jest zadaniem
 * dla redakcji — wpisane w docs.
 */
export const liczbaSolectw = (solectwa: readonly unknown[]): number => solectwa.length

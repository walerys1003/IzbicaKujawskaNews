import { PublicPageLayout } from './PublicPageLayout'

export const RedakcjaPage = () => PublicPageLayout({
  title: 'Redakcja',
  lead: 'Poznaj zasady odpowiedzialności redakcyjnej, role w zespole oraz standardy pracy z materiałami lokalnymi, sponsorowanymi i wspieranymi przez AI.',
  breadcrumbs: [{ label: 'Start', href: '/' }, { label: 'Redakcja' }],
  sections: [
    {
      heading: 'Model pracy',
      body: [
        'Redakcja działa w modelu newsroomowym: plan dnia, priorytetyzacja tematów, weryfikacja źródeł, publikacja i monitoring reakcji czytelników. AI wspiera klasyfikację, streszczenia i wersje pomocnicze, ale decyzja publikacyjna pozostaje po stronie człowieka.'
      ]
    },
    {
      heading: 'Standardy redakcyjne',
      body: [
        'Rozróżniamy informację, komentarz, materiał partnerski i ogłoszenie. Każdy format ma odrębne oznaczenie. Korekty, sprostowania i aktualizacje są publikowane transparentnie.'
      ],
      bullets: ['jawność źródeł, gdy to możliwe', 'wyraźne oznaczenie treści sponsorowanych', 'ostrożność przy publikacji danych wrażliwych i wizerunku']
    },
    {
      heading: 'Kontakt z zespołem',
      body: [
        'Tematy interwencyjne, materiały prasowe i propozycje stałej współpracy przyjmujemy przez kanały opisane na stronie kontaktowej i w sekcji dla prasy.'
      ]
    }
  ],
  sidebarTitle: 'Standard redakcji',
  sidebarItems: ['weryfikacja faktów przed publikacją', 'AI tylko jako narzędzie pomocnicze', 'transparentne korekty i aktualizacje'],
  pager: [
    { label: 'Kontakt', href: '/kontakt' },
    { label: 'Dla prasy', href: '/dla-prasy' },
    { label: 'Kariera', href: '/kariera' }
  ]
})

import { PublicPageLayout } from './PublicPageLayout'

export const AboutPage = () => PublicPageLayout({
  title: 'O nas',
  lead: 'izbica24.pl to lokalny magazyn cyfrowy dla mieszkańców Izbicy Kujawskiej — łączymy klasyczne dziennikarstwo lokalne z workflowem AI, redakcyjną weryfikacją oraz szybkim publikowaniem informacji publicznych.',
  breadcrumbs: [{ label: 'Start', href: '/' }, { label: 'O nas' }],
  sections: [
    {
      heading: 'Misja',
      body: [
        'Naszym celem jest uporządkowane, czytelne i szybkie informowanie o sprawach gminy: od samorządu i inwestycji po kulturę, sport, edukację i życie codzienne.',
        'Budujemy portal, do którego mieszkaniec wraca nie tylko po news, ale też po praktyczne informacje, archiwum lokalnej pamięci i zaufany kontakt z redakcją.'
      ]
    },
    {
      heading: 'Jak pracujemy',
      body: [
        'W części procesów korzystamy z narzędzi AI do streszczeń, tagowania, wersji SEO i draftów pomocniczych. Każda publikacja finalna przechodzi jednak przez standard redakcyjny i odpowiedzialność człowieka.',
      ],
      bullets: [
        'najpierw źródło i weryfikacja, potem publikacja',
        'czytelny podział na informację, opinię i materiał sponsorowany',
        'lokalny kontekst ważniejszy niż clickbait'
      ]
    },
    {
      heading: 'Dla kogo',
      body: [
        'Dla mieszkańców, organizacji społecznych, samorządu, szkół, OSP, parafii, klubów sportowych i lokalnych firm, które chcą komunikować się nowocześnie i przejrzyście.'
      ]
    }
  ],
  sidebarTitle: 'W skrócie',
  sidebarItems: ['Portal lokalny z architekturą edge', 'AI wspiera newsroom, ale nie zastępuje redakcji', 'Publikujemy treści informacyjne, praktyczne i archiwalne'],
  pager: [
    { label: 'Kontakt', href: '/kontakt' },
    { label: 'Redakcja', href: '/redakcja' },
    { label: 'Prywatność', href: '/polityka-prywatnosci' }
  ]
})

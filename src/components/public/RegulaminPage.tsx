import { PublicPageLayout } from './PublicPageLayout'

export const RegulaminPage = () => PublicPageLayout({
  title: 'Regulamin serwisu',
  lead: 'Poniższy dokument określa zasady korzystania z serwisu izbica24.pl, publikowania materiałów, komentarzy oraz warunki współpracy z użytkownikami i partnerami.',
  breadcrumbs: [{ label: 'Start', href: '/' }, { label: 'Regulamin' }],
  sections: [
    {
      heading: 'Postanowienia ogólne',
      body: [
        'Serwis ma charakter informacyjny i redakcyjny. Korzystanie z portalu oznacza akceptację zasad opisanych na tej stronie.',
        'Redakcja może aktualizować regulamin w celu dostosowania go do zmian prawnych, organizacyjnych i technologicznych.'
      ]
    },
    {
      heading: 'Komentarze i materiały użytkowników',
      body: [
        'Użytkownik odpowiada za treść publikowanych komentarzy oraz zgłaszanych materiałów. Niedozwolone są treści bezprawne, obraźliwe, wprowadzające w błąd lub naruszające dobra osobiste.'
      ],
      bullets: ['redakcja może moderować i usuwać wpisy', 'zakazane jest podszywanie się pod inne osoby', 'użytkownik powinien podawać prawdziwe dane kontaktowe w formularzach']
    },
    {
      heading: 'Prawa autorskie',
      body: [
        'Treści redakcyjne, elementy identyfikacji wizualnej i układ serwisu podlegają ochronie prawnej. Dalsze wykorzystanie wymaga podstawy prawnej albo zgody redakcji.'
      ]
    }
  ],
  pager: [
    { label: 'Prywatność', href: '/polityka-prywatnosci' },
    { label: 'Cookies', href: '/cookies' },
    { label: 'Kontakt', href: '/kontakt' }
  ]
})

import { PublicPageLayout } from './PublicPageLayout'

export const ContactPage = () => PublicPageLayout({
  title: 'Kontakt',
  lead: 'Masz temat, sprostowanie, informację o wydarzeniu albo pytanie dotyczące współpracy? Napisz do redakcji lub skorzystaj z jednego z dedykowanych kanałów kontaktu.',
  breadcrumbs: [{ label: 'Start', href: '/' }, { label: 'Kontakt' }],
  sections: [
    {
      heading: 'Kanały kontaktu',
      body: [
        'E-mail główny: redakcja@izbica24.pl. Dla tematów pilnych i interwencyjnych rekomendujemy wpisanie w tytule wiadomości kategorii oraz miejscowości.',
        'Adres korespondencyjny: ul. Marszałka Piłsudskiego 32, 87-865 Izbica Kujawska.'
      ],
      bullets: [
        'reklama i partnerstwa: reklama@izbica24.pl',
        'sprostowania i korekty: korekta@izbica24.pl',
        'press room: media@izbica24.pl'
      ]
    },
    {
      heading: 'Kiedy odpowiadamy',
      body: [
        'Standardowy czas odpowiedzi w dni robocze wynosi do 24 godzin. Zgłoszenia dotyczące bezpieczeństwa, awarii i komunikatów publicznych obsługujemy priorytetowo.'
      ]
    },
    {
      heading: 'Jak przesłać materiał',
      body: [
        'W wiadomości podaj kto, co, gdzie, kiedy i dlaczego. Dołącz zdjęcia, dokumenty źródłowe oraz zgodę na publikację wizerunku, jeśli jest wymagana.'
      ]
    }
  ],
  sidebarTitle: 'Dane redakcji',
  sidebarItems: ['redakcja@izbica24.pl', 'reklama@izbica24.pl', 'dni robocze 8:00–16:00'],
  pager: [
    { label: 'O nas', href: '/o-nas' },
    { label: 'Reklama', href: '/reklama' },
    { label: 'Dla prasy', href: '/dla-prasy' }
  ]
})

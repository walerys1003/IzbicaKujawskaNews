import { PublicPageLayout } from './PublicPageLayout'

export const PrivacyPage = () => PublicPageLayout({
  title: 'Polityka prywatności',
  lead: 'Dbamy o transparentność przetwarzania danych osobowych. Na tej stronie opisujemy cele przetwarzania, podstawy prawne, czas retencji oraz prawa użytkownika.',
  breadcrumbs: [{ label: 'Start', href: '/' }, { label: 'Polityka prywatności' }],
  sections: [
    {
      heading: 'Jakie dane przetwarzamy',
      body: [
        'Zakres danych zależy od sposobu korzystania z serwisu: mogą to być dane podawane dobrowolnie w formularzach, dane techniczne związane z ruchem HTTP oraz dane niezbędne do obsługi konta użytkownika.'
      ],
      bullets: ['adres e-mail i treść zgłoszenia', 'dane sesyjne i bezpieczeństwa', 'dane statystyczne o użyciu serwisu']
    },
    {
      heading: 'Cele i podstawy prawne',
      body: [
        'Dane przetwarzamy w celu obsługi korespondencji, prowadzenia serwisu, zwiększania bezpieczeństwa, realizacji obowiązków prawnych oraz rozwoju produktu.'
      ]
    },
    {
      heading: 'Prawa użytkownika',
      body: [
        'Masz prawo dostępu do danych, ich sprostowania, usunięcia, ograniczenia przetwarzania, przenoszenia oraz wniesienia sprzeciwu, jeśli podstawy prawne na to pozwalają.'
      ]
    }
  ],
  pager: [
    { label: 'Regulamin', href: '/regulamin' },
    { label: 'Cookies', href: '/cookies' },
    { label: 'Dostępność', href: '/deklaracja-dostepnosci' }
  ]
})

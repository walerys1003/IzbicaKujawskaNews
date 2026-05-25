import { Hono } from 'hono'
import { SimpleInfoPage } from '../../components/public/SimpleInfoPage'
import type { AppEnv } from '../../types/env'
import { renderPublicShell } from './shared'
const route = new Hono<AppEnv>()
route.get('/dla-prasy', (c) => renderPublicShell(c, SimpleInfoPage({
  title: 'Dla prasy',
  lead: 'Sekcja dla biur prasowych, instytucji i partnerów medialnych publikujących komunikaty, zaproszenia, zdjęcia i materiały do wykorzystania redakcyjnego.',
  slugLabel: 'Dla prasy',
  sections: [
    { heading: 'Materiały prasowe', body: ['Preferujemy pliki tekstowe lub linki do dokumentów źródłowych oraz zdjęcia z jasnym oznaczeniem praw do publikacji.'] },
    { heading: 'Standard przesyłki', body: ['W tytule wiadomości podaj instytucję, temat i datę. W treści dodaj osobę kontaktową oraz numer telefonu do potwierdzenia.'] },
    { heading: 'Patronaty i akredytacje', body: ['Wnioski o patronat i akredytację składane są mailowo z odpowiednim wyprzedzeniem. Decyzje podejmujemy po ocenie zgodności z profilem redakcji.'] }
  ],
  pager: [{ label: 'Kontakt', href: '/kontakt' }, { label: 'Reklama', href: '/reklama' }],
  sidebarTitle: 'Press room',
  sidebarItems: ['adres kontaktowy: media@izbica24.pl', 'pliki: JPG/PNG/PDF/TXT', 'mile widziany link do źródła i podpisy zdjęć']
}), 'Dla prasy — izbica24.pl'))
export default route

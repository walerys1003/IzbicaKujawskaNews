import { Hono } from 'hono'
import { SimpleInfoPage } from '../../components/public/SimpleInfoPage'
import type { AppEnv } from '../../types/env'
import { renderPublicShell } from './shared'
const route = new Hono<AppEnv>()
route.get('/kariera', (c) => renderPublicShell(c, SimpleInfoPage({
  title: 'Kariera',
  lead: 'Szukamy osób, które chcą współtworzyć nowoczesny lokalny newsroom: redaktorów, współpracowników terenowych, operatorów multimediów i specjalistów od automatyzacji.',
  slugLabel: 'Kariera',
  sections: [
    { heading: 'Kogo szukamy', body: ['Cenimy samodzielność, rzetelność i znajomość lokalnego kontekstu. Mile widziane doświadczenie w mediach, social media, SEO, montażu wideo lub narzędziach AI.'] },
    { heading: 'Jak aplikować', body: ['Wyślij krótkie portfolio, opis doświadczenia oraz informację, w jakim modelu chcesz współpracować: etat, freelance, korespondent lub staż.'] },
    { heading: 'Kultura pracy', body: ['Łączymy warsztat redakcyjny z nowoczesnymi narzędziami. Zespół pracuje iteracyjnie, transparentnie i z nastawieniem na jakość.'] }
  ],
  pager: [{ label: 'Redakcja', href: '/redakcja' }, { label: 'Kontakt', href: '/kontakt' }],
  sidebarTitle: 'Aktualnie mile widziane',
  sidebarItems: ['reporter lokalny', 'video / short-form editor', 'specjalista SEO + automatyzacja']
}), 'Kariera — izbica24.pl'))
export default route

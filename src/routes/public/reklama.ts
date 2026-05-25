import { Hono } from 'hono'
import { SimpleInfoPage } from '../../components/public/SimpleInfoPage'
import type { AppEnv } from '../../types/env'
import { renderPublicShell } from './shared'
const route = new Hono<AppEnv>()
route.get('/reklama', (c) => renderPublicShell(c, SimpleInfoPage({
  title: 'Reklama',
  lead: 'Przygotowujemy kampanie display, artykuły partnerskie, ogłoszenia lokalne i pakiety łączące ekspozycję na stronie z kanałami redakcyjnymi.',
  slugLabel: 'Reklama',
  sections: [
    { heading: 'Formaty', body: ['Obsługujemy formaty display, wpisy sponsorowane, patronaty medialne oraz pakiety dla wydarzeń, biznesu lokalnego i instytucji publicznych.'], bullets: ['placement na stronie głównej', 'sekcje sponsorowane', 'social amplification i newsletter'] },
    { heading: 'Proces', body: ['Każda współpraca otrzymuje brief, harmonogram i oznaczenie materiału. Redakcja zachowuje rozdział między treścią dziennikarską a komercyjną.'] },
    { heading: 'Kontakt handlowy', body: ['W sprawie oferty napisz na reklama@izbica24.pl i opisz cel kampanii, grupę docelową oraz przewidywany termin startu.'] }
  ],
  pager: [{ label: 'Kontakt', href: '/kontakt' }, { label: 'Dla prasy', href: '/dla-prasy' }, { label: 'Kariera', href: '/kariera' }],
  sidebarTitle: 'Oferta B2B',
  sidebarItems: ['display + content + social', 'lokalne kampanie zasięgowe', 'jasne oznaczenia materiałów reklamowych']
}), 'Reklama — izbica24.pl'))
export default route

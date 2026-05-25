import { Hono } from 'hono'
import { SimpleInfoPage } from '../../components/public/SimpleInfoPage'
import type { AppEnv } from '../../types/env'
import { renderPublicShell } from './shared'
const route = new Hono<AppEnv>()
route.get('/deklaracja-dostepnosci', (c) => renderPublicShell(c, SimpleInfoPage({
  title: 'Deklaracja dostępności',
  lead: 'Dążymy do tego, aby serwis był użyteczny dla jak najszerszej grupy odbiorców, w tym osób korzystających z technologii asystujących.',
  slugLabel: 'Deklaracja dostępności',
  sections: [
    { heading: 'Założenia', body: ['Projektujemy strony z myślą o czytelnej hierarchii, kontrastach, obsłudze klawiaturą i sensownych strukturach nagłówków.'] },
    { heading: 'Znane ograniczenia', body: ['Niektóre starsze materiały osadzone z zewnętrznych źródeł mogą nie spełniać wszystkich wymagań WCAG. Stopniowo uzupełniamy je o alternatywy i opisy.'] },
    { heading: 'Zgłaszanie problemów', body: ['Jeśli napotkasz barierę dostępności, napisz do redakcji z opisem podstrony i problemu. Zajmiemy się zgłoszeniem priorytetowo.'] }
  ],
  pager: [{ label: 'Prywatność', href: '/polityka-prywatnosci' }, { label: 'Kontakt', href: '/kontakt' }],
  sidebarTitle: 'Dostępność',
  sidebarItems: ['obsługa klawiatury', 'czytelne kontrasty', 'weryfikacja treści multimedialnych']
}), 'Deklaracja dostępności — izbica24.pl'))
export default route

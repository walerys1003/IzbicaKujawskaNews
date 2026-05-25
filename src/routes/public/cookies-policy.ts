import { Hono } from 'hono'
import { SimpleInfoPage } from '../../components/public/SimpleInfoPage'
import type { AppEnv } from '../../types/env'
import { renderPublicShell } from './shared'
const route = new Hono<AppEnv>()
route.get('/cookies', (c) => renderPublicShell(c, SimpleInfoPage({
  title: 'Polityka cookies',
  lead: 'Wyjaśniamy jakie pliki cookies i podobne technologie mogą być używane w serwisie oraz jak użytkownik może nimi zarządzać.',
  slugLabel: 'Cookies',
  sections: [
    { heading: 'Typy cookies', body: ['W serwisie mogą być używane cookies niezbędne, analityczne i funkcjonalne. Zakres zależy od uruchomionych funkcji oraz zgód użytkownika.'] },
    { heading: 'Zarządzanie zgodą', body: ['Użytkownik może zmienić ustawienia przeglądarki oraz decyzję w banerze zgód. Wyłączenie części cookies może ograniczyć działanie niektórych funkcji.'] },
    { heading: 'Podmioty trzecie', body: ['Jeżeli wdrażane są narzędzia analityczne lub osadzenia zewnętrzne, informujemy o tym w polityce prywatności i konfiguracji consent mode.'] }
  ],
  pager: [{ label: 'Prywatność', href: '/polityka-prywatnosci' }, { label: 'Regulamin', href: '/regulamin' }]
}), 'Cookies — izbica24.pl'))
export default route

import { Hono } from 'hono'
import { ContactPage } from '../../components/public/ContactPage'
import type { AppEnv } from '../../types/env'
import { renderPublicShell } from './shared'
const route = new Hono<AppEnv>()
route.get('/kontakt', (c) => renderPublicShell(c, ContactPage(), 'Kontakt — izbica24.pl'))
export default route

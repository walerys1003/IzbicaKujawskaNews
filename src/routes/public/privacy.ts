import { Hono } from 'hono'
import { PrivacyPage } from '../../components/public/PrivacyPage'
import type { AppEnv } from '../../types/env'
import { renderPublicShell } from './shared'
const route = new Hono<AppEnv>()
route.get('/polityka-prywatnosci', (c) => renderPublicShell(c, PrivacyPage(), 'Polityka prywatności — izbica24.pl'))
export default route

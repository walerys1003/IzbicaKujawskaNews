import { Hono } from 'hono'
import { RedakcjaPage } from '../../components/public/RedakcjaPage'
import type { AppEnv } from '../../types/env'
import { renderPublicShell } from './shared'
const route = new Hono<AppEnv>()
route.get('/redakcja', (c) => renderPublicShell(c, RedakcjaPage(), 'Redakcja — izbica24.pl'))
export default route

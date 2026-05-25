import { Hono } from 'hono'
import { RegulaminPage } from '../../components/public/RegulaminPage'
import type { AppEnv } from '../../types/env'
import { renderPublicShell } from './shared'
const route = new Hono<AppEnv>()
route.get('/regulamin', (c) => renderPublicShell(c, RegulaminPage(), 'Regulamin — izbica24.pl'))
export default route

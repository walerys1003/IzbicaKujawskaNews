import { Hono } from 'hono'
import { AboutPage } from '../../components/public/AboutPage'
import type { AppEnv } from '../../types/env'
import { renderPublicShell } from './shared'
const route = new Hono<AppEnv>()
route.get('/o-nas', (c) => renderPublicShell(c, AboutPage(), 'O nas — izbica24.pl'))
export default route

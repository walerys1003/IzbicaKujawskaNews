import type { Context } from 'hono'
import { DemoStrip, Footer, MainNav, SuperHeader } from '../../components/layout'
import type { AppEnv } from '../../types/env'

export const renderPublicShell = (c: Context<AppEnv>, page: JSX.Element, title: string) => {
  return c.render(
    <>
      <DemoStrip active="public" />
      <SuperHeader />
      <MainNav />
      <main id="page-main">{page}</main>
      <Footer />
    </>,
    { title }
  )
}

// Playwright validation: zero side margins + module presence at 3 viewports
import { chromium } from 'playwright'

const URL = 'http://localhost:3000/'
const viewports = [
  { name: 'desktop-1920', width: 1920, height: 1080 },
  { name: 'tablet-768', width: 768, height: 1024 },
  { name: 'mobile-375', width: 375, height: 812 },
]

const browser = await chromium.launch()
const ctx = await browser.newContext()

const results = []

for (const vp of viewports) {
  const page = await ctx.newPage()
  await page.setViewportSize({ width: vp.width, height: vp.height })
  await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 })

  // Measurements
  const data = await page.evaluate(() => {
    const $ = (sel) => document.querySelector(sel)
    const measure = (el) => {
      if (!el) return null
      const r = el.getBoundingClientRect()
      const cs = getComputedStyle(el)
      return {
        x: Math.round(r.x),
        width: Math.round(r.width),
        right: Math.round(window.innerWidth - r.right),
        ml: cs.marginLeft,
        mr: cs.marginRight,
        pl: cs.paddingLeft,
        pr: cs.paddingRight,
        bg: cs.backgroundColor,
      }
    }
    const body = measure(document.body)
    const html = measure(document.documentElement)
    return {
      vw: window.innerWidth,
      docW: document.documentElement.scrollWidth,
      bodyW: document.body.scrollWidth,
      hasHScroll: document.documentElement.scrollWidth > window.innerWidth + 1,
      body,
      html,
      superheader: measure($('#superheader')),
      mainNav: measure($('#main-nav')),
      breakingBar: measure($('#breaking-bar')),
      skrotDnia: measure($('.kpi-strip')?.closest('.modv2') || $('.kpi-strip')),
      naSygnale: measure($('#na-sygnale')),
      newsletter: measure($('.newsletter-inline')),
      mainGrid: measure($('.main-grid')),
      footer: measure($('footer')),
      // Module presence
      modules: {
        skrotDnia: !!$('.kpi-strip'),
        awarie: !!$('.awarie-list'),
        drogi: !!$('.drogi-item'),
        dyzury: !!$('.dyzury-grid'),
        ceny: !!$('.ceny-table'),
        pomagamy: !!$('.pomagamy-card'),
        kronika: !!$('.kronika-row'),
        kalendarz: !!$('.kalendarz-week'),
        top: !!$('.top-item'),
        mowia: !!$('.mowia-quote'),
        newsletter: !!$('.newsletter-inline'),
        mainGrid: !!$('.main-grid'),
      },
    }
  })

  // Screenshot
  const screenshotPath = `/tmp/v2-${vp.name}.png`
  await page.screenshot({ path: screenshotPath, fullPage: false })

  results.push({ viewport: vp, data, screenshotPath })
  await page.close()
}

await browser.close()

console.log(JSON.stringify(results, null, 2))

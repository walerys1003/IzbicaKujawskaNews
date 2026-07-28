#!/usr/bin/env node
// Pomiar CLS i geometrii obrazów w prawdziwej przeglądarce.
//
// Po co osobny skrypt, a nie „grep width= w HTML”:
// audyt policzył brak atrybutów width/height i uznał to za przyczynę CLS.
// Atrybut jest jednak tylko JEDNYM ze sposobów rezerwacji miejsca — drugim
// jest `aspect-ratio` na kontenerze, którego ten portal używa szeroko
// (.news-card .img-wrap, .hero-main, .k-img …). Dopóki nie zmierzymy CLS
// w silniku układu, nie wiemy, czy problem w ogóle istnieje ani czy nasza
// naprawa cokolwiek zmieniła. Ten skrypt mierzy trzy rzeczy:
//   1. rzeczywisty CLS (PerformanceObserver layout-shift),
//   2. ile obrazów ma zerową wysokość układu w chwili przed dekodowaniem,
//   3. czy proporcje narzucone przez CSS zgadzają się z proporcjami pliku.
import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:3000/'
const przegladarka = await chromium.launch()
const strona = await przegladarka.newPage({ viewport: { width: 1366, height: 900 } })

// Instalujemy obserwator PRZED nawigacją, inaczej przegapimy przesunięcia
// z pierwszych klatek — a to właśnie one dają najwyższy wynik CLS.
await strona.addInitScript(() => {
  window.__cls = 0
  window.__przesuniecia = []
  new PerformanceObserver((lista) => {
    for (const wpis of lista.getEntries()) {
      if (wpis.hadRecentInput) continue
      window.__cls += wpis.value
      window.__przesuniecia.push({ wartosc: wpis.value, czas: Math.round(wpis.startTime) })
    }
  }).observe({ type: 'layout-shift', buffered: true })
})

await strona.goto(url, { waitUntil: 'load' })
// Obrazy lazy dekodują się po układzie; dajemy im czas i przewijamy stronę,
// bo przesunięcie powstaje dopiero, gdy obraz wejdzie do viewportu.
await strona.evaluate(async () => {
  for (let y = 0; y < document.body.scrollHeight; y += 600) {
    window.scrollTo(0, y)
    await new Promise((r) => setTimeout(r, 60))
  }
  window.scrollTo(0, 0)
})
await strona.waitForTimeout(1200)

const wynik = await strona.evaluate(() => {
  const obrazy = [...document.querySelectorAll('img')]
  const bezAtrybutow = obrazy.filter((i) => !i.getAttribute('width') || !i.getAttribute('height'))
  const zeroWysokosci = []
  const zlaProporcja = []

  for (const img of obrazy) {
    const box = img.getBoundingClientRect()
    if (box.height < 1) zeroWysokosci.push(img.currentSrc || img.src)
    if (img.naturalWidth > 0 && box.width > 0 && box.height > 0) {
      const plik = img.naturalWidth / img.naturalHeight
      const uklad = box.width / box.height
      // object-fit:cover celowo przycina, więc rozbieżność sama w sobie nie
      // jest błędem; raportujemy tylko skrajne przypadki (>25%).
      if (Math.abs(plik - uklad) / plik > 0.25) {
        zlaProporcja.push({
          src: (img.currentSrc || img.src).split('/').pop(),
          plik: plik.toFixed(2),
          uklad: uklad.toFixed(2),
          objectFit: getComputedStyle(img).objectFit,
        })
      }
    }
  }

  // Czy rodzic <picture> jest inline? Inline element nie tworzy bloku, więc
  // height:100% na dziecku nie ma do czego się odnieść.
  const pictures = [...document.querySelectorAll('picture')]
  const inlinePicture = pictures.filter((p) => getComputedStyle(p).display === 'inline').length

  return {
    cls: Number(window.__cls.toFixed(5)),
    przesuniecia: window.__przesuniecia.length,
    najwieksze: window.__przesuniecia.sort((a, b) => b.wartosc - a.wartosc).slice(0, 5),
    obrazow: obrazy.length,
    bezAtrybutow: bezAtrybutow.length,
    zeroWysokosci: zeroWysokosci.length,
    picture: pictures.length,
    inlinePicture,
    zlaProporcja: zlaProporcja.slice(0, 10),
    zlaProporcjaLacznie: zlaProporcja.length,
  }
})

await przegladarka.close()

const prog = 0.1 // próg „good” dla CLS wg Core Web Vitals
console.log(`\n=== POMIAR CLS: ${url} ===`)
console.log(`CLS ............................ ${wynik.cls}  (próg good ≤ ${prog})`)
console.log(`przesunięć układu .............. ${wynik.przesuniecia}`)
console.log(`obrazów ........................ ${wynik.obrazow}`)
console.log(`  bez width/height ............. ${wynik.bezAtrybutow}`)
console.log(`  o zerowej wysokości układu ... ${wynik.zeroWysokosci}`)
console.log(`<picture> ...................... ${wynik.picture}`)
console.log(`  z display:inline ............. ${wynik.inlinePicture}`)
console.log(`skrajnie inne proporcje ........ ${wynik.zlaProporcjaLacznie}`)
if (wynik.najwieksze.length) {
  console.log('\nnajwiększe przesunięcia:')
  wynik.najwieksze.forEach((p) => console.log(`  ${p.wartosc.toFixed(5)} @ ${p.czas} ms`))
}
if (wynik.zlaProporcja.length) {
  console.log('\nproporcje pliku vs układu:')
  wynik.zlaProporcja.forEach((p) =>
    console.log(`  ${p.src}: plik ${p.plik} / układ ${p.uklad} (object-fit:${p.objectFit})`),
  )
}

if (wynik.cls > prog) {
  console.error(`\n✗ CLS ${wynik.cls} przekracza próg ${prog}`)
  process.exit(1)
}
console.log(`\n✓ CLS w normie`)

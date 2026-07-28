// Walidacja danych strukturalnych: parsujemy KAŻDY blok ld+json i sprawdzamy,
// czy jest poprawnym JSON-em oraz czy ma wymagane pola. Sam fakt obecności
// <script type="application/ld+json"> nic nie znaczy — blok z błędem składni
// jest przez Google po cichu pomijany, więc grep dałby fałszywy pozytyw.
const strony = [
  '/', '/wiadomosci', '/kultura',
  '/wiadomosci/inwestycje/remont-ulicy-koscielnej-zakonczony-przed-terminem',
]
let bledy = 0
for (const s of strony) {
  const html = await (await fetch('http://localhost:3000' + s)).text()
  const bloki = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)]
  console.log(`\n=== ${s} — bloków: ${bloki.length} ===`)
  for (const [, tresc] of bloki) {
    let obj
    try { obj = JSON.parse(tresc) } catch (e) { console.log(`  ✗ NIEPOPRAWNY JSON: ${e.message}`); bledy++; continue }
    const typ = obj['@type']
    const braki = []
    if (!obj['@context']) braki.push('@context')
    if (!typ) braki.push('@type')
    if (typ === 'NewsArticle') {
      for (const p of ['headline','datePublished','author','publisher','image','url']) if (!obj[p]) braki.push(p)
      if (obj.author && !obj.author.name) braki.push('author.name')
      if (obj.image && !String(obj.image[0]||'').startsWith('http')) braki.push('image (nie bezwzględny)')
    }
    if (typ === 'BreadcrumbList') {
      if (!Array.isArray(obj.itemListElement) || !obj.itemListElement.length) braki.push('itemListElement')
      else {
        obj.itemListElement.forEach((it,i)=>{ if(it.position!==i+1) braki.push(`position[${i}]=${it.position}`); if(!it.name) braki.push(`name[${i}]`) })
        const ost = obj.itemListElement.at(-1)
        if (ost.item) braki.push('ostatni element ma item (nie powinien)')
      }
    }
    if (typ === 'WebSite' && !obj.potentialAction) braki.push('potentialAction')
    // null w danych strukturalnych = błąd typu u Google
    const nulle = JSON.stringify(obj).match(/:null/g)
    if (nulle) braki.push(`${nulle.length}× null`)
    if (braki.length) { console.log(`  ✗ ${typ}: brakuje/błąd → ${braki.join(', ')}`); bledy++ }
    else console.log(`  ✓ ${typ}`)
  }
  if (!bloki.length) { console.log('  ✗ BRAK danych strukturalnych'); bledy++ }
}
console.log(bledy ? `\n✗ błędów: ${bledy}` : '\n✓ wszystkie bloki poprawne')
process.exit(bledy ? 1 : 0)

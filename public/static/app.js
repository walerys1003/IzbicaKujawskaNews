// =========================================================================
// izbica24.pl — frontend interactivity
// =========================================================================

(function () {
  'use strict'

  // ===== 1. Super-header hide on scroll =====
  const superHeader = document.getElementById('super-header')
  const mainNav = document.getElementById('main-nav')
  let lastScroll = 0
  function onScroll() {
    const y = window.scrollY
    if (superHeader) superHeader.classList.toggle('hide', y > 80)
    if (mainNav) mainNav.classList.toggle('sticky', y > 80)
    lastScroll = y
  }
  window.addEventListener('scroll', onScroll, { passive: true })
  onScroll()

  // ===== 2. Reveal animations =====
  if ('IntersectionObserver' in window) {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry, i) => {
          if (entry.isIntersecting) {
            setTimeout(() => entry.target.classList.add('visible'), Math.min(i * 80, 320))
            obs.unobserve(entry.target)
          }
        })
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    )
    document.querySelectorAll('.reveal').forEach((el) => obs.observe(el))
  } else {
    document.querySelectorAll('.reveal').forEach((el) => el.classList.add('visible'))
  }

  // ===== 3. Hamburger mobile menu =====
  const hamburger = document.getElementById('hamburger')
  const menu = document.getElementById('mainMenu')
  if (hamburger && menu) {
    hamburger.addEventListener('click', () => {
      menu.classList.toggle('open')
      document.body.style.overflow = menu.classList.contains('open') ? 'hidden' : ''
    })
  }

  // ===== 4. News filter (demo) =====
  const filterBtns = document.querySelectorAll('.filter-tag')
  const newsCards = document.querySelectorAll('.news-card')
  filterBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const f = btn.dataset.filter
      filterBtns.forEach((b) => b.classList.remove('active'))
      btn.classList.add('active')
      newsCards.forEach((c) => {
        const cat = c.dataset.cat
        c.style.display = f === 'Wszystkie' || cat === f ? '' : 'none'
      })
    })
  })

  // ===== 5. Sołectwa — interaktywna mapa =====
  const tooltip = document.getElementById('mapTooltip')
  const solNodes = document.querySelectorAll('.sol-node')
  if (tooltip && solNodes.length) {
    solNodes.forEach((node) => {
      node.style.cursor = 'pointer'
      node.addEventListener('mouseenter', (e) => {
        const name = node.dataset.name
        const count = node.dataset.count
        tooltip.querySelector('.tt-name').textContent = name
        tooltip.querySelector('.tt-count').textContent = count + ' artykułów'
        tooltip.classList.add('visible')
      })
      node.addEventListener('mousemove', (e) => {
        const container = node.closest('.map-container')
        if (!container) return
        const rect = container.getBoundingClientRect()
        const x = e.clientX - rect.left + 14
        const y = e.clientY - rect.top + 14
        tooltip.style.left = x + 'px'
        tooltip.style.top = y + 'px'
      })
      node.addEventListener('mouseleave', () => tooltip.classList.remove('visible'))
      node.addEventListener('click', () => {
        const name = node.dataset.name
        alert('Filtruj artykuły z sołectwa: ' + name + '\n(W produkcji: przekierowanie do /tag/' + name.toLowerCase() + ')')
      })
      // Hover hex highlight
      const circle = node.querySelector('circle')
      if (circle) {
        node.addEventListener('mouseenter', () => circle.setAttribute('fill', '#c0392b'))
        node.addEventListener('mouseleave', () => circle.setAttribute('fill', '#d0dce8'))
      }
    })
  }

  // ===== 6. RAG search (po stronie klienta) =====
  const ragInput = document.getElementById('ragQuery')
  const ragBtn = document.getElementById('ragBtn')
  const ragResults = document.getElementById('ragResults')
  const suggestions = document.querySelectorAll('.rag-suggestion')

  // Polish stop-words
  const STOP = new Set('a aby ach acz aczkolwiek aj albo ale ależ ani aż bardziej bardzo bo bowiem by byli bynajmniej być był była było były będzie będą cali cała cały ci cię ciebie co cokolwiek coraz coś czasami czasem czemu czy czyli daleko dla dlaczego dlatego do dobrze dokąd dość dużo dwa dwaj dwie dwoje dziś dzisiaj gdy gdyby gdyż gdzie gdziekolwiek gdzieś go i ich ile im inna inne inny innych iż ja ją jak jakaś jakby jaki jakichś jakie jakimś jakiś jakiż jakoś jako jakże jednak jednakże jego jej jemu jest jestem jeszcze jeśli jeżeli już ją każdy kiedy kilka kimś kto ktokolwiek ktoś która które którego której który których którym którzy ku lat lecz lub ma mają mam mi mimo między mna mną mnie moi moim moja moje może możliwe można mój mu musi my na nad nam nami nas nasi nasz nasza nasze naszego naszej naszych natomiast natychmiast nawet nią nic nich nie niech niego niej niemu nigdy nim nimi niż no o obok od około on ona one oni ono oraz oto owszem pan pana pani po pod podczas pomimo ponad ponieważ powinien powinna powinni powinno poza prawie przecież przed przede przedtem przez przy raz razie roku również sam sama są się skąd sobie sobą sposób swoje ta tak taka taki takie także tam te tego tej temu ten teraz też to tobie tobą toteż trzeba tu tutaj twoi twoim twoja twoje twym twój ty tych tylko tym u w wam wami was wasi wasz wasza wasze we według wiele wielu więc więcej wszyscy wszystkich wszystkie wszystkim wszystko wtedy wy z za zapewne zawsze ze zł znowu znów żaden żadna żadne żadnych że żeby'.split(' '))

  function tokenize(text) {
    const lower = text.toLowerCase()
    const matches = lower.match(/[a-ząćęłńóśźż0-9]+/g) || []
    return matches.filter(t => t.length > 2 && !STOP.has(t))
  }

  let ragIndex = null
  let ragChunks = null
  let ragLoading = null

  async function loadRagIndex() {
    if (ragIndex) return
    if (ragLoading) return ragLoading
    ragLoading = Promise.all([
      fetch('/data/bm25_index.json').then(r => r.json()),
      fetch('/data/chunks.json').then(r => r.json())
    ]).then(([idx, chs]) => {
      ragIndex = idx
      ragChunks = chs
      console.log('[RAG] Indeks załadowany:', ragIndex.N, 'chunków,', Object.keys(ragIndex.idf).length, 'terminów')
    })
    return ragLoading
  }

  function bm25Search(query, k = 5) {
    if (!ragIndex || !ragChunks) return []
    const k1 = 1.5, b = 0.75
    const qTokens = tokenize(query)
    if (!qTokens.length) return []
    const scores = new Float32Array(ragIndex.N)
    for (const qt of qTokens) {
      const idf = ragIndex.idf[qt]
      if (idf === undefined) continue
      for (let i = 0; i < ragIndex.N; i++) {
        const tf = ragIndex.tf[i][qt]
        if (!tf) continue
        const dl = ragIndex.doc_lens[i]
        const denom = tf + k1 * (1 - b + b * dl / ragIndex.avgdl)
        scores[i] += idf * (tf * (k1 + 1) / denom)
      }
    }
    const results = []
    for (let i = 0; i < ragIndex.N; i++) {
      if (scores[i] > 0) results.push({ idx: i, score: scores[i] })
    }
    results.sort((a, b) => b.score - a.score)
    return results.slice(0, k).map(r => ({
      ...ragChunks[r.idx],
      score: Math.round(r.score * 10000) / 10000
    }))
  }

  async function doRagSearch(query) {
    if (!query || !query.trim()) return
    ragResults.innerHTML = '<p style="text-align:center; padding: 24px; color: var(--ink-faint);">⏳ Ładuję indeks i przeszukuję bazę wiedzy...</p>'
    try {
      const t0 = performance.now()
      await loadRagIndex()
      const results = bm25Search(query, 6)
      const dt = (performance.now() - t0).toFixed(0)
      if (!results.length) {
        ragResults.innerHTML = '<p style="color: var(--ink-faint); text-align: center; padding: 24px;">Brak wyników dla: <strong>' + escapeHtml(query) + '</strong></p>'
        return
      }
      ragResults.innerHTML =
        '<h2 style="margin-top: 32px;">📊 Znaleziono ' + results.length + ' wyników <small style="font: 400 13px var(--ui); color: var(--ink-faint);">· ' + dt + ' ms</small></h2>' +
        results.map((r) =>
          '<div class="rag-result">' +
          '<div class="rag-result-head">' +
            '<span class="rag-source">' + escapeHtml(r.source) + '</span>' +
            '<span class="rag-score">score: ' + r.score.toFixed(2) + '</span>' +
          '</div>' +
          '<div class="rag-section">📍 ' + escapeHtml(r.section || '') + '</div>' +
          '<div class="rag-text">' + escapeHtml(r.text) + '</div>' +
          '</div>'
        ).join('')
    } catch (err) {
      ragResults.innerHTML = '<p style="color: var(--red);">Błąd: ' + escapeHtml(err.message) + '</p>'
      console.error('[RAG]', err)
    }
  }

  function escapeHtml(s) {
    if (s == null) return ''
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
  }

  if (ragBtn) ragBtn.addEventListener('click', () => doRagSearch(ragInput.value))
  if (ragInput)
    ragInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') doRagSearch(ragInput.value) })
  suggestions.forEach((s) =>
    s.addEventListener('click', () => {
      const q = s.dataset.q
      if (ragInput) ragInput.value = q
      doRagSearch(q)
    })
  )

  // ===== 7. Newsletter form (sidebar) =====
  document.querySelectorAll('.sb-newsletter button, .ogl-cta a').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      const block = btn.closest('.sb-newsletter')
      if (block) {
        const input = block.querySelector('input')
        if (input && input.value) {
          btn.textContent = '✓ Zapisano'
          btn.style.background = 'var(--c-kujawianka)'
          setTimeout(() => {
            btn.textContent = 'Zapisz się'
            btn.style.background = ''
            input.value = ''
          }, 2500)
        }
      } else {
        // ogłoszenia CTA
        alert('W produkcji: formularz dodawania ogłoszenia')
      }
    })
  })

  // ===== 8. Tip box =====
  document.querySelectorAll('.sb-tip-box button').forEach((btn) => {
    btn.addEventListener('click', () => {
      const txt = btn.previousElementSibling
      if (txt && txt.value.trim().length > 5) {
        btn.textContent = '✓ Dziękujemy!'
        btn.style.background = 'var(--c-kujawianka)'
        setTimeout(() => {
          btn.textContent = 'Wyślij newsa'
          btn.style.background = ''
          txt.value = ''
        }, 2500)
      } else {
        txt.focus()
        txt.style.borderColor = 'var(--red)'
        setTimeout(() => (txt.style.borderColor = ''), 1500)
      }
    })
  })

  // ===== 9. Auto-refresh "live" sygnale time =====
  // (W demo: aktualizujemy pulsujący indicator co minutę)
  // Reset animacji co minutę dla efektu „świeżości"
  setInterval(() => {
    document.querySelectorAll('.live-dot').forEach((el) => {
      el.style.animation = 'none'
      setTimeout(() => (el.style.animation = ''), 10)
    })
  }, 60000)

  // ===== 10. Smooth scroll dla linków sekcji =====
  document.querySelectorAll('a[href^="#"], a[href^="/#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const hash = a.getAttribute('href').replace('/', '')
      if (hash.startsWith('#') && hash.length > 1) {
        const el = document.querySelector(hash)
        if (el) {
          e.preventDefault()
          window.scrollTo({ top: el.offsetTop - 120, behavior: 'smooth' })
        }
      }
    })
  })

  console.log('%c izbica24.pl ', 'background: #c0392b; color: white; font-family: Playfair Display, serif; font-size: 16px; font-weight: 900; padding: 4px 8px;', 'Portal Gminy Izbica Kujawska — prototyp v1.0')
})()

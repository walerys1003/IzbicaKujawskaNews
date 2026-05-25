;(() => {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return

  const sent = new Set()
  const endpoint = '/api/analytics/vitals'
  const page = window.location.pathname

  const sendMetric = (name, value, extra = {}) => {
    const key = `${name}:${page}`
    if (sent.has(key) && name !== 'CLS') return
    sent.add(key)
    const payload = {
      name,
      value: Number(value.toFixed ? value.toFixed(4) : value),
      pathname: page,
      ts: new Date().toISOString(),
      userAgent: navigator.userAgent,
      ...extra,
    }

    const body = JSON.stringify(payload)
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }))
      return
    }
    fetch(endpoint, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
    }).catch(() => undefined)
  }

  let clsValue = 0
  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const shift = entry
      if (!shift.hadRecentInput) clsValue += shift.value || 0
    }
    sendMetric('CLS', clsValue)
  }).observe({ type: 'layout-shift', buffered: true })

  new PerformanceObserver((list) => {
    const [entry] = list.getEntries().slice(-1)
    if (entry) sendMetric('LCP', entry.startTime, { element: entry.element?.tagName || null })
  }).observe({ type: 'largest-contentful-paint', buffered: true })

  new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      const firstInput = entry
      sendMetric('FID', firstInput.processingStart - firstInput.startTime)
    }
  }).observe({ type: 'first-input', buffered: true })
})()

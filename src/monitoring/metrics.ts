export interface CounterMetric { type: 'counter'; name: string; help: string; value: number }
export interface GaugeMetric { type: 'gauge'; name: string; help: string; value: number }
export interface HistogramMetric { type: 'histogram'; name: string; help: string; buckets: number[]; counts: number[]; sum: number; observations: number }
export type Metric = CounterMetric | GaugeMetric | HistogramMetric

const registry = new Map<string, Metric>()

export const counter = (name: string, help: string) => {
  if (!registry.has(name)) registry.set(name, { type: 'counter', name, help, value: 0 })
  return {
    inc: (value = 1) => { (registry.get(name) as CounterMetric).value += value },
  }
}

export const gauge = (name: string, help: string) => {
  if (!registry.has(name)) registry.set(name, { type: 'gauge', name, help, value: 0 })
  return {
    set: (value: number) => { (registry.get(name) as GaugeMetric).value = value },
    inc: (value = 1) => { (registry.get(name) as GaugeMetric).value += value },
    dec: (value = 1) => { (registry.get(name) as GaugeMetric).value -= value },
  }
}

export const histogram = (name: string, help: string, buckets = [10, 50, 100, 250, 500, 1000]) => {
  if (!registry.has(name)) registry.set(name, { type: 'histogram', name, help, buckets, counts: buckets.map(() => 0), sum: 0, observations: 0 })
  return {
    observe: (value: number) => {
      const metric = registry.get(name) as HistogramMetric
      metric.sum += value
      metric.observations += 1
      metric.buckets.forEach((bucket, index) => {
        if (value <= bucket) metric.counts[index] += 1
      })
    },
  }
}

export const getMetric = (name: string) => registry.get(name)
export const listMetrics = () => [...registry.values()]
export const clearMetrics = () => registry.clear()

export const renderPrometheus = (): string => listMetrics().flatMap((metric) => {
  const lines = [`# HELP ${metric.name} ${metric.help}`, `# TYPE ${metric.name} ${metric.type}`]
  if (metric.type === 'counter' || metric.type === 'gauge') {
    lines.push(`${metric.name} ${metric.value}`)
  } else {
    metric.buckets.forEach((bucket, index) => lines.push(`${metric.name}_bucket{le="${bucket}"} ${metric.counts[index]}`))
    lines.push(`${metric.name}_count ${metric.observations}`)
    lines.push(`${metric.name}_sum ${metric.sum}`)
  }
  return lines
}).join('\n')

export const httpRequestsTotal = counter('http_requests_total', 'Total HTTP requests')
export const httpRequestDurationMs = histogram('http_request_duration_ms', 'HTTP request duration in ms')
export const rateLimitedRequestsTotal = counter('rate_limited_requests_total', 'Rate limited requests')
export const healthStatusGauge = gauge('health_status', 'Health status 1=ok 0=degraded')

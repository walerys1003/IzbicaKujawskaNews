export interface TimeseriesPoint { timestamp: string; value: number }

export const detectSpike = (series: TimeseriesPoint[], thresholdMultiplier = 2.5) => {
  if (series.length < 3) return { anomalous: false, baseline: 0, latest: 0 }
  const latest = series[series.length - 1].value
  const historical = series.slice(0, -1).map((point) => point.value)
  const baseline = historical.reduce((sum, value) => sum + value, 0) / historical.length
  return { anomalous: latest > baseline * thresholdMultiplier, baseline, latest }
}

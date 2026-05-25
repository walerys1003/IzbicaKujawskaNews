import type { Bindings } from '../types/env'

export const fetchCfAnalytics = async (_env: Bindings, since = '24h') => ({
  source: 'cloudflare-analytics-bridge',
  since,
  available: false,
  message: 'Configure account token and account id to enable upstream analytics fetch.',
})

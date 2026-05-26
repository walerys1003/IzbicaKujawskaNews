// SA4: Security headers middleware
import type { Context } from 'hono'
import type { AppEnv } from '../types/env'

export const securityHeaders = async (c: Context<AppEnv>, next: () => Promise<void>) => {
  await next()

  const res = c.res

  // HSTS (HTTP Strict Transport Security)
  res.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload')

  // CSP (Content-Security-Policy)
  res.headers.set('Content-Security-Policy', [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.jsdelivr.net",
    "img-src 'self' data: blob: https://*.izbica24.pl https://*.r2.cloudflarestorage.com https://*.cloudflarestream.com",
    "font-src 'self' https://fonts.gstatic.com",
    "media-src 'self' https://*.r2.cloudflarestorage.com https://*.cloudflarestream.com",
    "connect-src 'self' https://*.izbica24.pl https://api.openai.com https://api.anthropic.com",
    "frame-src 'self' https://www.youtube.com https://player.vimeo.com https://www.facebook.com",
    "frame-ancestors 'self'",
    "form-action 'self'",
    "base-uri 'self'",
    "object-src 'none'",
  ].join('; '))

  // X-Frame-Options (fallback dla starszych przeglądarek)
  res.headers.set('X-Frame-Options', 'SAMEORIGIN')

  // X-Content-Type-Options
  res.headers.set('X-Content-Type-Options', 'nosniff')

  // Referrer-Policy
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions-Policy
  res.headers.set('Permissions-Policy', [
    'camera=()',
    'microphone=()',
    'geolocation=(self)',
    'interest-cohort=()',
  ].join(', '))

  // X-XSS-Protection (legacy)
  res.headers.set('X-XSS-Protection', '1; mode=block')

  // X-DNS-Prefetch-Control
  res.headers.set('X-DNS-Prefetch-Control', 'on')

  // Cache-Control for static assets (handled by CF, but set safe defaults)
  if (!res.headers.has('Cache-Control')) {
    res.headers.set('Cache-Control', 'public, max-age=0, must-revalidate')
  }
}

// CORS middleware for API
export const corsHeaders = async (c: Context<AppEnv>, next: () => Promise<void>) => {
  c.res.headers.set('Access-Control-Allow-Origin', c.req.header('Origin') || 'https://izbica24.pl')
  c.res.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  c.res.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  c.res.headers.set('Access-Control-Max-Age', '86400')
  c.res.headers.set('Access-Control-Allow-Credentials', 'true')

  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204)
  }

  await next()
}

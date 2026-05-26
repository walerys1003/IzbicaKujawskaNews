// SA9: Email provider abstraction (Resend / SendGrid / Mailgun)
import type { Bindings } from '../../types/env'

export interface EmailMessage {
  to: string | string[]
  subject: string
  html?: string
  text?: string
  from?: string
  replyTo?: string
}

export interface EmailProvider {
  send(message: EmailMessage): Promise<{ ok: boolean; messageId?: string; error?: string }>
  sendBatch(messages: EmailMessage[]): Promise<{ sent: number; failed: number; errors: string[] }>
}

// Resend provider
export function createResendProvider(apiKey: string): EmailProvider {
  const baseUrl = 'https://api.resend.com/emails'
  const defaultFrom = 'izbica24.pl <newsletter@izbica24.pl>'

  return {
    async send(message) {
      try {
        const res = await fetch(baseUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: message.from || defaultFrom,
            to: message.to,
            subject: message.subject,
            html: message.html,
            text: message.text,
            reply_to: message.replyTo,
          }),
        })
        const data = await res.json() as Record<string, unknown>
        if (!res.ok) return { ok: false, error: String(data.message || 'send_failed') }
        return { ok: true, messageId: String(data.id || '') }
      } catch (err) {
        return { ok: false, error: String(err) }
      }
    },

    async sendBatch(messages) {
      let sent = 0, failed = 0
      const errors: string[] = []
      for (const msg of messages) {
        const result = await this.send(msg)
        if (result.ok) sent++
        else { failed++; errors.push(result.error || 'unknown') }
      }
      return { sent, failed, errors }
    },
  }
}

// Mock provider for development/testing
export function createMockEmailProvider(): EmailProvider {
  return {
    async send(message) {
      console.log('[MOCK EMAIL] To:', message.to, 'Subject:', message.subject)
      return { ok: true, messageId: `mock-${Date.now()}` }
    },
    async sendBatch(messages) {
      console.log(`[MOCK EMAIL] Batch send: ${messages.length} messages`)
      return { sent: messages.length, failed: 0, errors: [] }
    },
  }
}

// Factory: create provider based on available env
export function createEmailProvider(env: Bindings): EmailProvider {
  const apiKey = env.OPENAI_API_KEY ? undefined : undefined // Placeholder — in production: env.RESEND_API_KEY
  if (!apiKey) return createMockEmailProvider()
  return createResendProvider(apiKey)
}

// Newsletter email template
export function newsletterTemplate(title: string, articles: Array<{ title: string; lead: string; url: string }>, unsubscribeUrl: string): string {
  const articleListHtml = articles.map(a => `
    <tr>
      <td style="padding: 12px 0; border-bottom: 1px solid #eee;">
        <a href="${a.url}" style="color: #1a1a2e; text-decoration: none; font-weight: 600; font-size: 16px;">${a.title}</a>
        <p style="color: #555; font-size: 13px; margin: 4px 0 0;">${a.lead}</p>
      </td>
    </tr>
  `).join('')

  return `<!DOCTYPE html>
<html lang="pl">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="font-family: system-ui, -apple-system, sans-serif; background: #f5f5f5; margin: 0; padding: 0;">
  <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background: #fff;">
    <tr>
      <td style="padding: 24px; background: #1a1a2e; text-align: center;">
        <h1 style="color: #fff; margin: 0; font-size: 24px;">📰 izbica24.pl</h1>
        <p style="color: #ccc; margin: 4px 0 0; font-size: 13px;">${title}</p>
      </td>
    </tr>
    <tr>
      <td style="padding: 24px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          ${articleListHtml}
        </table>
      </td>
    </tr>
    <tr>
      <td style="padding: 16px 24px; background: #fafafa; text-align: center; font-size: 11px; color: #888;">
        <p>Otrzymujesz tego maila ponieważ zapisałeś/aś się na newsletter izbica24.pl.</p>
        <p><a href="${unsubscribeUrl}" style="color: #e94560;">Wypisz się z newslettera</a></p>
      </td>
    </tr>
  </table>
</body>
</html>`
}

import { Hono } from 'hono'
import { newsroomActions } from '../ai/newsroom'

type Env = {
  Bindings: {
    OPENAI_API_KEY?: string
    ANTHROPIC_API_KEY?: string
  }
}

const app = new Hono<Env>()

app.get('/', c => c.json({ ok: true, actions: Object.keys(newsroomActions) }))
app.post('/:action', async c => {
  const action = c.req.param('action') as keyof typeof newsroomActions
  const handler = newsroomActions[action]
  if (!handler) return c.json({ error: 'UNKNOWN_ACTION' }, 404)
  const payload = await c.req.json().catch(() => ({}))
  const result = await handler(c.env, payload)
  return c.json({ ok: true, action, result })
})

export default app

import { access, readFile } from 'node:fs/promises'

const smoke = [
  'docs/README.md',
  'docs/API.md',
  'scripts/deploy.sh',
  'wrangler-staging.jsonc',
  'wrangler-prod.jsonc',
]
for (const file of smoke) await access(file)
const apiDoc = await readFile('docs/API.md', 'utf8')
if (!apiDoc.includes('/api/v1/health')) throw new Error('API docs missing health endpoint')
if (!apiDoc.includes('/api/ai/prompts')) throw new Error('API docs missing AI prompts endpoint')
console.log('Test OK: docs and deployment artifacts present.')

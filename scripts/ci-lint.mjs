import { access, readFile } from 'node:fs/promises'

const required = [
  'src/index.tsx',
  'src/routes/ai.ts',
  'src/routes/rag.ts',
  'wrangler.jsonc',
  '.github/workflows/ci.yml',
]
for (const file of required) await access(file)
const pkg = JSON.parse(await readFile('package.json', 'utf8'))
for (const script of ['build', 'lint', 'test']) {
  if (!pkg.scripts?.[script]) throw new Error(`Missing npm script: ${script}`)
}
console.log('Lint OK: repo contract files exist.')

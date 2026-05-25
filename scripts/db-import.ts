#!/usr/bin/env node
import { execSync } from 'node:child_process'
import fs from 'node:fs'

const db = process.env.D1_DB_NAME || 'izbica24-dev'
const remoteFlag = process.env.D1_REMOTE === '1' ? '--remote' : '--local'
const filePath = process.argv[2]
if (!filePath) {
  console.error('Usage: node scripts/db-import.ts <file.json>')
  process.exit(1)
}

const raw = JSON.parse(fs.readFileSync(filePath, 'utf8')) as Record<string, Array<Record<string, unknown>> | { results?: Array<Record<string, unknown>> }>
for (const [table, payload] of Object.entries(raw)) {
  const rows = Array.isArray(payload) ? payload : (payload.results || [])
  for (const row of rows) {
    const keys = Object.keys(row)
    if (!keys.length) continue
    const values = keys.map((key) => row[key])
    const sqlValues = values.map((value) => {
      if (value === null || value === undefined) return 'NULL'
      if (typeof value === 'number') return String(value)
      return `'${String(value).replace(/'/g, "''")}'`
    }).join(', ')
    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${sqlValues});`
    execSync(`wrangler d1 execute ${db} ${remoteFlag} --command "${sql.replace(/"/g, '\\"')}"`, { stdio: 'inherit' })
  }
}
console.log('Import complete for', db)

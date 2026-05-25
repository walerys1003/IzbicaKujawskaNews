#!/usr/bin/env node
import { execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const db = process.env.D1_DB_NAME || 'izbica24-dev'
const remoteFlag = process.env.D1_REMOTE === '1' ? '--remote' : '--local'
const migrationsDir = path.resolve(process.cwd(), 'migrations')
const files = fs.readdirSync(migrationsDir).filter((name) => /^000[3-9]/.test(name) || /^001[0-3]/.test(name)).sort()

for (const file of files) {
  const sqlPath = path.join(migrationsDir, file)
  console.log('Applying', file)
  execSync(`wrangler d1 execute ${db} ${remoteFlag} --file ${sqlPath}`, { stdio: 'inherit' })
}

console.log('Seed pipeline finished for', db)

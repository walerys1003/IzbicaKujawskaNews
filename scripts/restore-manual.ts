import { decryptBackup } from '../src/lib/backup/encrypt'

const payload = process.argv[2]
const secret = process.argv[3] || 'development-secret'
if (!payload) {
  console.error('usage: tsx scripts/restore-manual.ts <payload> [secret]')
  process.exit(1)
}
console.log(await decryptBackup(payload, secret))

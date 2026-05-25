import { exportD1ToSql } from '../src/lib/backup/d1-export'

const sql = await exportD1ToSql(undefined)
console.log(sql)

/* eslint-disable no-console */
// Verify Google Sheet mirror: create issue via API -> check row lands in CRM-Live tab
import fs from 'fs'
import path from 'path'
import { google } from 'googleapis'

const BASE = 'http://localhost:3000'
let cookies = {}
function setCookies(res) {
  res.headers.getSetCookie?.().forEach((c) => {
    const [pair] = c.split(';')
    const eq = pair.indexOf('=')
    cookies[pair.slice(0, eq)] = pair.slice(eq + 1)
  })
}
function cookieHeader() { return Object.entries(cookies).map(([k, v]) => `${k}=${v}`).join('; ') }

function loadEnv() {
  const env = {}
  for (const line of fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8').split('\n')) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/)
    if (m) env[m[1]] = m[2].trim()
  }
  return env
}

async function main() {
  const env = loadEnv()
  const SPREADSHEET_ID = env.GOOGLE_SHEET_ID
  const TAB = env.SYNC_SHEET_TAB || 'CRM-Live'
  const key = JSON.parse(Buffer.from(env.GOOGLE_SERVICE_KEY_B64, 'base64').toString())
  const auth = new google.auth.GoogleAuth({ credentials: key, scopes: ['https://www.googleapis.com/auth/spreadsheets'] })
  const sheets = google.sheets({ version: 'v4', auth })

  // login
  const csrfRes = await fetch(`${BASE}/api/auth/csrf`)
  setCookies(csrfRes)
  const { csrfToken } = await csrfRes.json()
  const loginRes = await fetch(`${BASE}/api/auth/callback/credentials`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', Cookie: cookieHeader() },
    body: new URLSearchParams({ csrfToken, username: 'admin', password: 'admin123', json: 'true' }),
    redirect: 'manual',
  })
  setCookies(loginRes)
  console.log('login:', loginRes.status)

  // create issue
  const createRes = await fetch(`${BASE}/api/sheets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader() },
    body: JSON.stringify({
      'Customer Name': 'SYNC-TEST-CUSTOMER',
      'Contact Number': '012000SYNC',
      Branch: 'City 2',
      Status: 'Pending',
      'Issue code': 'Others',
      'Start Call': '2026-11-03',
    }),
  })
  const created = await createRes.json()
  const id = created.id
  console.log('created issue id:', id)

  await new Promise((r) => setTimeout(r, 4000))

  async function readRows() {
    const res = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: `${TAB}!A2:Z` })
    return res.data.values || []
  }

  const rows1 = await readRows()
  const found1 = rows1.find((r) => r[0] === String(id))
  console.log('mirror create:', found1 ? '✅ FOUND' : '❌ NOT FOUND')
  if (found1) {
    console.log('  row sample:', JSON.stringify({ ticket: found1[1], customer: found1[9], branch: found1[5], createdBy: found1[21] }))
  }

  // update via API
  await fetch(`${BASE}/api/sheets/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader() },
    body: JSON.stringify({ Status: 'Closed' }),
  })
  await new Promise((r) => setTimeout(r, 4000))
  const rows2 = await readRows()
  const found2 = rows2.find((r) => r[0] === String(id))
  console.log('mirror update:', found2 && found2[13] === 'Closed' ? '✅ Status updated to Closed' : `❌ status=${found2?.[13]}`)

  // cleanup: delete issue (clears mirrored row) 
  await fetch(`${BASE}/api/sheets/${id}`, { method: 'DELETE', headers: { Cookie: cookieHeader() } })
  await new Promise((r) => setTimeout(r, 4000))
  const rows3 = await readRows()
  const found3 = rows3.find((r) => r[0] === String(id))
  const deletedFlag = found3 && found3[25] === 'Yes'
  console.log('mirror soft-delete:', deletedFlag ? '✅ marked Deleted=Yes' : '❌')
  console.log('sync status:', JSON.stringify((await (await fetch(`${BASE}/api/sheets-sync`, { headers: { Cookie: cookieHeader() } })).json())))

  console.log('\nDONE — cleanup: wipe local DB data/ + remove mirror tab row if needed')
}

main().catch((e) => { console.error(e); process.exit(1) })

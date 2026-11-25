import { getSheets } from './googleSheets'
import { getDb } from './db'

// ========= Google Sheet Mirror (auto-sync) =========
// SQLite stays the fast primary store; every new/edited complaint is
// mirrored to a "CRM-Live" tab in the linked Google Sheet in real time.

const TAB = process.env.SYNC_SHEET_TAB || 'CRM-Live'
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID

export const MIRROR_COLUMNS = [
  'CRM ID', 'Ticket', 'Start Call', '2nd Call', 'Closing Date', 'Branch',
  'Complaints Destination', 'Mobile Type', 'Sold By', 'Customer Name',
  'Contact Number', 'Description', 'Final Conclusion', 'Status', 'Handled by',
  'Issue code', 'Exception', 'Amount Refund', 'Refund Reason', 'Follow up',
  'Note', 'Created By', 'Created At', 'Updated By', 'Updated At', 'Deleted',
]

const globalCache = globalThis
if (!globalCache.__sheetSyncCache) {
  globalCache.__sheetSyncCache = {
    ready: false,          // tab + header verified
    rowMap: new Map(),     // sqlite id -> sheet row number
    nextRow: 2,            // next free row number
    lastError: null,
    lastErrorAt: null,
    writes: 0,
  }
}

function cache() {
  return globalCache.__sheetSyncCache
}

function isConfigured() {
  return !!SPREADSHEET_ID && (process.env.SHEET_SYNC_ENABLED || '1') !== '0'
}

function rowValues(row) {
  const v = (x) => (x === null || x === undefined ? '' : String(x))
  return MIRROR_COLUMNS.map((col) => {
    switch (col) {
      case 'CRM ID': return v(row.id)
      case 'Ticket': return v(row.ticket)
      case 'Start Call': return v(row.start_call)
      case '2nd Call': return v(row.second_call)
      case 'Closing Date': return v(row.closing_date)
      case 'Branch': return v(row.branch)
      case 'Complaints Destination': return v(row.destination)
      case 'Mobile Type': return v(row.mobile_type)
      case 'Sold By': return v(row.sold_by)
      case 'Customer Name': return v(row.customer_name)
      case 'Contact Number': return v(row.contact_number)
      case 'Description': return v(row.description)
      case 'Final Conclusion': return v(row.final_conclusion)
      case 'Status': return v(row.status)
      case 'Handled by': return v(row.handled_by)
      case 'Issue code': return v(row.issue_code)
      case 'Exception': return v(row.exception)
      case 'Amount Refund': return v(row.amount_refund)
      case 'Refund Reason': return v(row.refund_reason)
      case 'Follow up': return v(row.follow_up)
      case 'Note': return v(row.note)
      case 'Created By': return v(row.created_by)
      case 'Created At': return row.created_at ? String(row.created_at).replace('T', ' ').split('.')[0] : ''
      case 'Updated By': return v(row.updated_by)
      case 'Updated At': return row.updated_at ? String(row.updated_at).replace('T', ' ').split('.')[0] : ''
      case 'Deleted': return row.deleted ? 'Yes' : ''
      default: return ''
    }
  })
}

async function ensureReady() {
  if (cache().ready) return true
  if (!isConfigured()) return false
  try {
    const sheets = getSheets()

    // does the tab exist?
    const meta = await sheets.spreadsheets.get({ spreadsheetId: SPREADSHEET_ID })
    const exists = (meta.data.sheets || []).some((s) => s.properties?.title === TAB)
    if (!exists) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: SPREADSHEET_ID,
        requestBody: { requests: [{ addSheet: { properties: { title: TAB } } }] },
      })
    }

    // write header if missing
    const head = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TAB}!1:1`,
    })
    const values = head.data.values || []
    if (!values.length || values[0].filter(Boolean).join('|') !== MIRROR_COLUMNS.join('|')) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${TAB}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [MIRROR_COLUMNS] },
      })
      cache().nextRow = 2
    } else {
      // rebuild id -> row map (column A = CRM ID)
      const ids = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${TAB}!A:A`,
      })
      const col = ids.data.values || []
      const map = new Map()
      let max = 1
      for (let i = 0; i < col.length; i++) {
        const id = parseInt(col[i]?.[0])
        if (!isNaN(id)) {
          map.set(id, i + 1)
          if (i + 1 > max) max = i + 1
        }
      }
      cache().rowMap = map
      cache().nextRow = max + 1
    }

    cache().ready = true
    return true
  } catch (err) {
    cache().lastError = err.message
    cache().lastErrorAt = new Date().toISOString()
    console.error('sheetSync ensureReady failed:', err.message)
    return false
  }
}

export function getSyncStatus() {
  return {
    configured: isConfigured(),
    ready: cache().ready,
    tab: TAB,
    mirroredRows: cache().rowMap.size,
    writes: cache().writes,
    lastError: cache().lastError,
    lastErrorAt: cache().lastErrorAt,
  }
}

// Mirror one issue (fire-and-forget safe wrapper: returns fast, never throws)
export async function syncIssueRow(row) {
  if (!isConfigured()) return false
  try {
    if (!(await ensureReady())) return false
    const sheets = getSheets()
    const values = [rowValues(row)]
    const rowNumber = cache().rowMap.get(row.id)

    if (rowNumber) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${TAB}!A${rowNumber}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      })
    } else {
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${TAB}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values },
      })
      cache().rowMap.set(row.id, cache().nextRow)
      cache().nextRow++
    }
    cache().writes++
    return true
  } catch (err) {
    cache().lastError = err.message
    cache().lastErrorAt = new Date().toISOString()
    console.error('sheetSync write failed:', err.message)
    return false
  }
}

// Clear the mirrored row (permanent delete)
export async function clearMirrorRow(id) {
  if (!isConfigured()) return false
  try {
    if (!(await ensureReady())) return false
    const rowNumber = cache().rowMap.get(id)
    if (!rowNumber) return false
    const sheets = getSheets()
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${TAB}!A${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [MIRROR_COLUMNS.map(() => '')] },
    })
    return true
  } catch (err) {
    cache().lastError = err.message
    console.error('sheetSync clear failed:', err.message)
    return false
  }
}

// Full re-sync: push everything (chunked) — used by the admin button/endpoint
export async function fullSync(rows, { clearFirst = false } = {}) {
  if (!isConfigured()) return { success: false, error: 'Sheet sync not configured' }
  try {
    if (!(await ensureReady())) return { success: false, error: cache().lastError }
    const sheets = getSheets()

    if (clearFirst) {
      // wipe tab data (keep header)
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `${TAB}!A2:Z`,
      })
      cache().rowMap = new Map()
      cache().nextRow = 2
    }

    let appended = 0
    const CHUNK = 500
    for (let i = 0; i < rows.length; i += CHUNK) {
      const chunk = rows.slice(i, i + CHUNK).map(rowValues)
      await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: `${TAB}!A1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: chunk },
      })
      for (const row of rows.slice(i, i + CHUNK)) {
        cache().rowMap.set(row.id, cache().nextRow)
        cache().nextRow++
      }
      appended += chunk.length
    }
    return { success: true, appended }
  } catch (err) {
    cache().lastError = err.message
    return { success: false, error: err.message }
  }
}

// ========= Restore on boot (free hosting with ephemeral disk) =========
// Reads the CRM-Live tab and re-inserts any complaint that is missing from
// the local SQLite file. Runs once per server start when SHEET_RESTORE_ON_BOOT=1.
const COLUMN_TO_DB = {
  'CRM ID': 'id',
  'Ticket': 'ticket',
  'Start Call': 'start_call',
  '2nd Call': 'second_call',
  'Closing Date': 'closing_date',
  'Branch': 'branch',
  'Complaints Destination': 'destination',
  'Mobile Type': 'mobile_type',
  'Sold By': 'sold_by',
  'Customer Name': 'customer_name',
  'Contact Number': 'contact_number',
  'Description': 'description',
  'Final Conclusion': 'final_conclusion',
  'Status': 'status',
  'Handled by': 'handled_by',
  'Issue code': 'issue_code',
  'Exception': 'exception',
  'Amount Refund': 'amount_refund',
  'Refund Reason': 'refund_reason',
  'Follow up': 'follow_up',
  'Note': 'note',
  'Created By': 'created_by',
  'Created At': 'created_at',
  'Updated By': 'updated_by',
  'Updated At': 'updated_at',
}

let restorePromise = null

// Startup restore used by the root layout on free hosts (ephemeral disk).
// Skipped unless SHEET_RESTORE_ON_BOOT=1. Never blocks longer than 10s.
export function ensureBootRestore() {
  if (process.env.SHEET_RESTORE_ON_BOOT !== '1') return Promise.resolve({ skipped: true })
  const run = restoreFromSheet()
  return Promise.race([
    run,
    new Promise((resolve) => setTimeout(() => resolve({ timeout: true }), 10000)),
  ])
}

export async function restoreFromSheet() {
  if (restorePromise) return restorePromise
  restorePromise = (async () => {
    if (!isConfigured()) return { success: false, error: 'Sheet sync not configured' }
    try {
      if (!(await ensureReady())) return { success: false, error: cache().lastError }
      const sheets = getSheets()
      const res = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${TAB}!A2:Z`,
      })
      const rows = res.data.values || []
      const db = getDb()
      const existing = new Set(db.prepare('SELECT id FROM issues').all().map((r) => r.id))

      const insert = db.prepare(`
        INSERT OR IGNORE INTO issues
          (id, ticket, start_call, second_call, closing_date, branch, destination, mobile_type,
           sold_by, customer_name, contact_number, description, final_conclusion, status,
           handled_by, issue_code, exception, amount_refund, refund_reason, follow_up, note,
           created_by, created_at, updated_by, updated_at, source, deleted)
        VALUES
          (@id, @ticket, @start_call, @second_call, @closing_date, @branch, @destination, @mobile_type,
           @sold_by, @customer_name, @contact_number, @description, @final_conclusion, @status,
           @handled_by, @issue_code, @exception, @amount_refund, @refund_reason, @follow_up, @note,
           @created_by, @created_at, @updated_by, @updated_at, @source, @deleted)
      `)

      let inserted = 0
      const runAll = db.transaction((list) => {
        for (const row of list) {
          const id = parseInt(row[0])
          if (isNaN(id) || existing.has(id)) continue
          const rec = {
            id,
            ticket: '', start_call: '', second_call: '', closing_date: '', branch: '',
            destination: '', mobile_type: '', sold_by: '', customer_name: '', contact_number: '',
            description: '', final_conclusion: '', status: 'Pending', handled_by: '',
            issue_code: '', exception: '', amount_refund: '', refund_reason: '', follow_up: '',
            note: '', created_by: '', created_at: new Date().toISOString(), updated_by: '',
            updated_at: null, source: 'sheet-restore', deleted: 0,
          }
          MIRROR_COLUMNS.forEach((col, i) => {
            const dbCol = COLUMN_TO_DB[col]
            if (!dbCol) return
            const cell = row[i]
            if (cell !== undefined && cell !== null && String(cell).trim() !== '') {
              rec[dbCol] = String(cell)
            }
          })
          rec.deleted = String(row[25] || '').toLowerCase() === 'yes' ? 1 : 0
          if (!rec.created_at || rec.created_at === 'null') rec.created_at = new Date().toISOString()
          insert.run(rec)
          inserted++
        }
      })
      runAll(rows)

      cache().writes += 0
      console.log(`[sheetSync] restoreFromSheet: ${inserted} row(s) restored from ${TAB}`)
      return { success: true, restored: inserted, scanned: rows.length }
    } catch (err) {
      cache().lastError = err.message
      console.error('[sheetSync] restoreFromSheet failed:', err.message)
      return { success: false, error: err.message }
    }
  })()
  return restorePromise
}


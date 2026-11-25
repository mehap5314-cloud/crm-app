import { getDb } from '@/lib/db'
import { logHistory } from '@/lib/history'
import { syncIssueRow, clearMirrorRow } from '@/lib/sheetSync'

// Friendly display names <-> DB columns
export const FIELD_MAP = {
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
  'Ticket': 'ticket',
}

const FRIENDLY_KEYS = Object.keys(FIELD_MAP)
const SEARCH_COLUMNS = ['ticket', 'customer_name', 'contact_number', 'issue_code', 'description', 'branch', 'mobile_type', 'sold_by', 'handled_by', 'status', 'final_conclusion', 'refund_reason']

export function rowToIssue(row) {
  if (!row) return null
  const issue = {
    id: row.id,
    source: row.source,
    created_by: row.created_by,
    created_at: row.created_at,
    updated_by: row.updated_by,
    updated_at: row.updated_at,
    deleted: !!row.deleted,
  }
  for (const [friendly, col] of Object.entries(FIELD_MAP)) {
    issue[friendly] = row[col] || ''
  }
  // Derived audit labels for UI
  issue['Created By'] = row.created_by || ''
  issue['Modified By'] = row.updated_by || ''
  return issue
}

function issueToCols(data, existing = {}) {
  const cols = {}
  for (const [friendly, col] of Object.entries(FIELD_MAP)) {
    if (friendly in data) cols[col] = data[friendly] ?? ''
  }
  // Accept raw column names too (import)
  for (const [friendly, col] of Object.entries(FIELD_MAP)) {
    if (col in data && !(friendly in data)) cols[col] = data[col] ?? ''
  }
  return cols
}

export function listIssues(opts = {}) {
  const db = getDb()
  const {
    search = '', status = '', branch = '', destination = '', issueCode = '',
    handledBy = '', from = '', to = '', page = 1, pageSize = 50,
    all = false, deleted = false, sort = 'id_desc',
  } = opts

  const where = ['deleted = ?']
  const params = [deleted ? 1 : 0]

  if (search) {
    const q = `%${search.toLowerCase()}%`
    const conds = SEARCH_COLUMNS.map((c) => `LOWER(COALESCE(${c},'')) LIKE ?`).join(' OR ')
    where.push(`(${conds})`)
    SEARCH_COLUMNS.forEach(() => params.push(q))
  }
  if (status) { where.push('status = ?'); params.push(status) }
  if (branch) { where.push('branch = ?'); params.push(branch) }
  if (destination) { where.push('destination = ?'); params.push(destination) }
  if (issueCode) { where.push('issue_code = ?'); params.push(issueCode) }
  if (handledBy) { where.push('handled_by = ?'); params.push(handledBy) }
  if (from) { where.push("date(COALESCE(NULLIF(start_call,''), date(created_at))) >= date(?)"); params.push(from) }
  if (to) { where.push("date(COALESCE(NULLIF(start_call,''), date(created_at))) <= date(?)"); params.push(to) }

  const whereSql = `WHERE ${where.join(' AND ')}`
  const orderBy =
    sort === 'id_asc' ? 'id ASC'
    : sort === 'start_call_desc' ? "start_call DESC, id DESC"
    : sort === 'customer' ? "customer_name COLLATE NOCASE ASC, id DESC"
    : 'id DESC'

  if (all) {
    const rows = db.prepare(`SELECT * FROM issues ${whereSql} ORDER BY ${orderBy}`).all(...params)
    return { issues: rows.map(rowToIssue), total: rows.length }
  }

  const total = db.prepare(`SELECT COUNT(*) AS c FROM issues ${whereSql}`).get(...params).c
  const size = Math.min(500, Math.max(1, pageSize))
  const offset = (Math.max(1, page) - 1) * size
  const rows = db.prepare(`SELECT * FROM issues ${whereSql} ORDER BY ${orderBy} LIMIT ? OFFSET ?`).all(...params, size, offset)
  return { issues: rows.map(rowToIssue), total, page: Math.max(1, page), pageSize: size }
}

export function getIssueData(id) {
  const row = getDb().prepare('SELECT * FROM issues WHERE id = ?').get(Number(id))
  return row ? rowToIssue(row) : null
}

export function getIssueRaw(id) {
  return getDb().prepare('SELECT * FROM issues WHERE id = ?').get(Number(id))
}

export function nextTicket() {
  const maxId = getDb().prepare('SELECT COALESCE(MAX(id),0) AS m FROM issues').get().m
  return String(1000 + maxId + 1)
}

export function createIssueData(data, user, meta = {}) {
  const db = getDb()
  const cols = issueToCols(data)
  const now = new Date().toISOString()
  const createdBy = user?.name || 'System'
  const source = meta.source || 'manual'

  const userTicket = cols.ticket !== undefined && String(cols.ticket).trim() !== '' ? String(cols.ticket).trim() : ''
  if (!userTicket && 'ticket' in cols) delete cols.ticket

  const keys = Object.keys(cols)
  const extraCols = ['created_by', 'created_by_id', 'created_at', 'source']
  const allCols = [...keys, ...extraCols]
  const info = db.prepare(
    `INSERT INTO issues (${allCols.join(',')}) VALUES (${allCols.map(() => '?').join(',')})`
  ).run(...keys.map((k) => cols[k]), createdBy, user?.id || null, now, source)

  const id = info.lastInsertRowid
  let ticket = userTicket
  if (!ticket) {
    ticket = nextTicketFromId(id)
    db.prepare('UPDATE issues SET ticket = ? WHERE id = ?').run(ticket, id)
  }
  const initialChanges = source === 'import' ? [] : FRIENDLY_KEYS
    .filter((k) => keys.includes(FIELD_MAP[k]))
    .map((k) => ({ field: k, from: '', to: cols[FIELD_MAP[k]] || '' }))
  logHistory({
    issueId: id,
    issueTicket: ticket,
    user,
    action: source === 'import' ? 'Imported' : 'Created issue',
    changes: initialChanges,
    details: `Ticket: ${ticket} — Customer: ${cols.customer_name || ''} — Branch: ${cols.branch || ''}`,
  })
  // mirror to Google Sheet (new manual entries only; updated imported rows sync too)
  const freshRow = getIssueRaw(id)
  if (freshRow) {
    syncIssueRow(freshRow).catch(() => {})
  }
  return { id, ticket }
}

function nextTicketFromId(id) {
  return String(1000 + Number(id))
}

export function updateIssueData(id, data, user) {
  const db = getDb()
  const row = getIssueRaw(id)
  if (!row) return { success: false, error: 'Issue not found' }

  const cols = issueToCols(data, row)
  const changes = []
  for (const [friendly, col] of Object.entries(FIELD_MAP)) {
    if (!(col in cols)) continue
    const oldVal = row[col] ?? ''
    const newVal = cols[col] ?? ''
    if (String(oldVal) !== String(newVal)) {
      changes.push({ field: friendly, from: oldVal, to: newVal })
    }
  }

  // Ticket uniqueness guard
  if (cols.ticket) {
    const dup = db.prepare('SELECT id FROM issues WHERE ticket = ? AND id != ? AND deleted = 0').get(cols.ticket, Number(id))
    if (dup) return { success: false, error: `Ticket ${cols.ticket} already used by issue #${dup.id}` }
  }

  const now = new Date().toISOString()
  if (Object.keys(cols).length > 0) {
    const setSql = Object.keys(cols).map((c) => `${c} = ?`).join(', ')
    db.prepare(`UPDATE issues SET ${setSql}, updated_by = ?, updated_at = ? WHERE id = ?`)
      .run(...Object.values(cols), user?.name || 'System', now, Number(id))
  }
  delete cols.ticket
  if (changes.length > 0) {
    logHistory({
      issueId: Number(id),
      issueTicket: row.ticket,
      user,
      action: 'Updated issue',
      changes,
      details: `${changes.length} field(s) changed`,
    })
  }
  // mirror updated row to Google Sheet
  const freshRow = getIssueRaw(id)
  if (freshRow) {
    syncIssueRow(freshRow).catch(() => {})
  }
  return { success: true, changes: changes.length, updated: Object.keys(cols).length > 0 }
}

export function softDeleteIssue(id, user) {
  const db = getDb()
  const row = getIssueRaw(id)
  if (!row) return { success: false, error: 'Issue not found' }
  db.prepare('UPDATE issues SET deleted = 1, deleted_at = ?, deleted_by = ? WHERE id = ?')
    .run(new Date().toISOString(), user?.name || 'System', Number(id))
  logHistory({ issueId: Number(id), issueTicket: row.ticket, user, action: 'Moved to trash', changes: [], details: `Customer: ${row.customer_name || ''}` })
  syncIssueRow(getIssueRaw(id)).catch(() => {})
  return { success: true }
}

export function restoreIssueData(id, user) {
  const db = getDb()
  const row = getIssueRaw(id)
  if (!row) return { success: false, error: 'Issue not found' }
  db.prepare('UPDATE issues SET deleted = 0, deleted_at = NULL, deleted_by = NULL WHERE id = ?').run(Number(id))
  logHistory({ issueId: Number(id), issueTicket: row.ticket, user, action: 'Restored', changes: [], details: 'Restored from trash' })
  syncIssueRow(getIssueRaw(id)).catch(() => {})
  return { success: true }
}

export function permanentDeleteData(id, user) {
  const db = getDb()
  const row = getIssueRaw(id)
  if (!row) return { success: false }
  db.prepare('DELETE FROM issues WHERE id = ?').run(Number(id))
  db.prepare('DELETE FROM issue_history WHERE issue_id = ?').run(Number(id))
  clearMirrorRow(Number(id)).catch(() => {})
  return { success: true }
}

export function listTrash(opts = {}) {
  const db = getDb()
  const { page = 1, pageSize = 50 } = opts
  const total = db.prepare('SELECT COUNT(*) AS c FROM issues WHERE deleted = 1').get().c
  const rows = db.prepare('SELECT * FROM issues WHERE deleted = 1 ORDER BY deleted_at DESC LIMIT ? OFFSET ?')
    .all(Math.min(500, pageSize), (Math.max(1, page) - 1) * pageSize)
  return { issues: rows.map(rowToIssue), total }
}

export function searchByContact(phone, excludeId = null) {
  const db = getDb()
  const rows = db.prepare(
    `SELECT * FROM issues WHERE deleted = 0 AND contact_number LIKE ? ${excludeId ? 'AND id != ?' : ''} ORDER BY id DESC LIMIT 20`
  ).all(...(excludeId ? [`%${phone}%`, Number(excludeId)] : [`%${phone}%`]))
  return rows.map(rowToIssue)
}

export function getStats() {
  const db = getDb()
  const today = new Date().toISOString().split('T')[0]
  const countBy = (cond) => db.prepare(`SELECT COUNT(*) AS c FROM issues WHERE deleted = 0 AND ${cond}`).get().c
  return {
    total: countBy(`1=1`),
    pending: countBy(`status = 'Pending'`),
    pending48h: countBy(`status = 'Pending 48H'`),
    escalated: countBy(`status = 'Escalated'`),
    closed: countBy(`status = 'Closed'`),
    today: countBy(`source = 'manual' AND created_at LIKE '${today}%'`),
    imported: countBy(`source = 'import'`),
    open: countBy(`status != 'Closed'`),
  }
}

export function getPerformance() {
  const rows = getDb().prepare(
    `SELECT COALESCE(NULLIF(handled_by,''),'Unassigned') AS name, COUNT(*) AS total,
      SUM(CASE WHEN status = 'Closed' THEN 1 ELSE 0 END) AS closed,
      SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'Pending 48H' THEN 1 ELSE 0 END) AS pending48h,
      SUM(CASE WHEN status = 'Escalated' THEN 1 ELSE 0 END) AS escalated
    FROM issues WHERE deleted = 0 GROUP BY COALESCE(NULLIF(handled_by,''),'Unassigned') ORDER BY total DESC`
  ).all()
  return rows.map((r) => ({ ...r, closed: r.closed || 0, pending: r.pending || 0, pending48h: r.pending48h || 0, escalated: r.escalated || 0 }))
}

export function getFollowupsData() {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const rows = getDb().prepare("SELECT * FROM issues WHERE deleted = 0 AND status != 'Closed' AND follow_up != '' ORDER BY id DESC").all()
  return rows.filter((issue) => {
    const dates = (issue.follow_up || '').split(',').map((s) => s.trim()).filter(Boolean)
    return dates.some((d) => {
      const dt = new Date(d)
      return !isNaN(dt.getTime()) && dt.setHours(0, 0, 0, 0) <= today.getTime()
    })
  }).slice(0, 50).map(rowToIssue)
}

export function bulkCreateIssues(rows, user) {
  const db = getDb()
  const now = new Date().toISOString()
  const insert = db.prepare(
    `INSERT INTO issues (ticket, start_call, second_call, closing_date, branch, destination, mobile_type, sold_by, customer_name, contact_number, description, final_conclusion, status, handled_by, issue_code, exception, amount_refund, follow_up, note, created_by, created_by_id, created_at, source)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'import')`
  )
  const history = db.prepare(
    `INSERT INTO issue_history (issue_id, issue_ticket, user_id, user_name, action, changes, details, created_at)
     VALUES (?, ?, ?, ?, 'Imported', '', ?, ?)`
  )
  const run = db.transaction((items) => {
    let count = 0
    for (const data of items) {
      const baseId = 1000 + db.prepare('SELECT COALESCE(MAX(id),0) AS m FROM issues').get().m + 1
      const info = insert.run(
        data['Ticket'] !== undefined && data['Ticket'] !== '' ? String(data['Ticket']) : String(baseId),
        data['Start Call'] || '', data['2nd Call'] || '', data['Closing Date'] || '',
        data['Branch'] || '', data['Complaints Destination'] || '', data['Mobile Type'] || '', data['Sold By'] || '',
        data['Customer Name'] || '', data['Contact Number'] || '', data['Description'] || '',
        data['Final Conclusion'] || '', data['Status'] || 'Pending', data['Handled by'] || '',
        data['Issue code'] || '', data['Exception'] || '', data['Amount Refund'] || '', data['Follow up'] || '',
        data['Note'] || '', user?.name || 'System', user?.id || null, now
      )
      history.run(info.lastInsertRowid, data['Ticket'] || '', user?.id || null, user?.name || 'System',
        `Imported from file — Customer: ${data['Customer Name'] || ''}`, now)
      count++
    }
    return count
  })
  const count = run(rows)
  return { success: true, count }
}

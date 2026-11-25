import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import * as XLSX from 'xlsx'
import { getDb } from '@/lib/db'
import { bulkCreateIssues } from '@/lib/issuesData'
import { NextResponse } from 'next/server'

// Normalize messy Google Sheets headers to our friendly field names
const HEADER_ALIASES = {
  'startcall': 'Start Call',
  'start call': 'Start Call',
  '2ndcall': '2nd Call',
  '2nd call': '2nd Call',
  'closingdate': 'Closing Date',
  'closing date': 'Closing Date',
  'branch': 'Branch',
  'complaintsdestination': 'Complaints Destination',
  'complaints destination': 'Complaints Destination',
  'mobiletype': 'Mobile Type',
  'mobile type': 'Mobile Type',
  'soldby': 'Sold By',
  'sold by': 'Sold By',
  'customername': 'Customer Name',
  'customer name': 'Customer Name',
  'contactnumber': 'Contact Number',
  'contact number': 'Contact Number',
  'contact nounber': 'Contact Number',
  'contact nounmber': 'Contact Number',
  'contact nombor': 'Contact Number',
  'contact no': 'Contact Number',
  'contactnumber2': 'Contact Number',
  'description': 'Description',
  'finalconclusion': 'Final Conclusion',
  'final conclusion': 'Final Conclusion',
  'status': 'Status',
  'handledby': 'Handled by',
  'handled by': 'Handled by',
  'issuecode': 'Issue code',
  'issue code': 'Issue code',
  'expotion': 'Exception',
  'exption': 'Exception',
  'exception': 'Exception',
  'amountrefund': 'Amount Refund',
  'amount refund': 'Amount Refund',
  'refund': 'Amount Refund',
  'followup': 'Follow up',
  'follow up': 'Follow up',
  'followup2': 'Follow up',
  'note': 'Note',
  'notes': 'Note',
  'ticket': 'Ticket',
  'تذكرة': 'Ticket',
  'رقم': 'Ticket',
}

function normHeader(h) {
  return String(h || '')
    .replace(/[\u200e\u200f\u202a-\u202e]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
}

// Dates from Excel/CSV can be Date objects, Excel serial numbers, or strings like "30/10"
function normalizeDate(val) {
  if (val === null || val === undefined) return ''
  if (val instanceof Date && !isNaN(val)) {
    return `${val.getFullYear()}-${String(val.getMonth() + 1).padStart(2, '0')}-${String(val.getDate()).padStart(2, '0')}`
  }
  if (typeof val === 'number' && val > 20000 && val < 60000) {
    const d = new Date(Date.UTC(1899, 11, 30) + val * 86400000)
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`
  }
  const s = String(val).replace(/[\u200e\u200f\u202a-\u202e]/g, '').trim()
  if (!s) return ''
  let m
  // dd/mm/yy (2-digit year)
  m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2})$/)
  if (m) {
    const yy = parseInt(m[3])
    const year = yy < 70 ? 2000 + yy : 1900 + yy
    return `${year}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  }
  // dd/mm/yyyy or dd-mm-yyyy
  m = s.match(/^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  // dd/mm (no year) — assume current year
  m = s.match(/^(\d{1,2})[/\-.](\d{1,2})$/)
  if (m) return `${new Date().getFullYear()}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}`
  // ISO already
  m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/)
  if (m) return `${m[1]}-${m[2].padStart(2, '0')}-${m[3].padStart(2, '0')}`
  return s
}

function cleanCell(v) {
  if (v === null || v === undefined) return ''
  if (v instanceof Date) return normalizeDate(v)
  return String(v).replace(/[\u200e\u200f\u202a-\u202e]/g, '').trim()
}

const DATE_FIELDS = ['Start Call', '2nd Call', 'Closing Date', 'Follow up']

function mapHeaders(headers) {
  const mapped = {}
  const unknown = []
  headers.forEach((h, i) => {
    const n = normHeader(h)
    if (!n) return
    if (HEADER_ALIASES[n]) mapped[i] = HEADER_ALIASES[n]
    else unknown.push(String(h))
  })
  return { mapped, unknown }
}

function rowToRecord(row, mapped) {
  const rec = {}
  for (const [idx, friendly] of Object.entries(mapped)) {
    const v = cleanCell(row[idx])
    if (DATE_FIELDS.includes(friendly) && v) {
      // Multi-date fields keep a comma list; normalize each part
      rec[friendly] = v.split(',').map((part) => part.trim() ? normalizeDate(part) : '').join(',')
    } else {
      rec[friendly] = v
    }
  }
  return rec
}

export async function POST(req) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin' && session.user.role !== 'manager') {
    return NextResponse.json({ error: 'Forbidden — admin/manager only' }, { status: 403 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get('file')
    const mode = formData.get('mode') || 'preview' // preview | commit
    const skipDuplicates = (formData.get('skipDuplicates') || 'true') === 'true'

    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true })
    const sheetName = wb.SheetNames[0]
    const sheet = wb.Sheets[sheetName]
    const rowsRaw = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', raw: true })

    if (!rowsRaw.length) return NextResponse.json({ error: 'File is empty' }, { status: 400 })

    // find header row: the first row containing "customer" or "branch" or >3 known headers
    let headerRowIdx = 0
    for (let i = 0; i < Math.min(rowsRaw.length, 5); i++) {
      const { mapped } = mapHeaders(rowsRaw[i])
      if (Object.keys(mapped).length >= 3) { headerRowIdx = i; break }
    }
    const headers = rowsRaw[headerRowIdx]
    const { mapped, unknown } = mapHeaders(headers)

    const dataRows = rowsRaw.slice(headerRowIdx + 1).filter((r) =>
      r.some((c) => String(c).trim() !== '')
    )

    const records = dataRows.map((r) => rowToRecord(r, mapped))

    // skip empty records (no meaningful data)
    const valid = records.filter((r) =>
      r['Customer Name'] || r['Contact Number'] || r['Description'] || r['Ticket']
    )
    // normalize dates with Date objects
    for (const r of valid) {
      for (const f of DATE_FIELDS) {
        if (r[f] instanceof Date) r[f] = normalizeDate(r[f])
      }
    }

    if (mode === 'preview') {
      return NextResponse.json({
        fileName: file.name,
        sheetName,
        headerRow: headers.map(String),
        mapping: mapped,
        unknownHeaders: unknown,
        totalRows: valid.length,
        totalFileRows: dataRows.length,
        sample: valid.slice(0, 8),
      })
    }

    // commit mode
    const db = getDb()
    let toInsert = valid
    let skipped = 0

    if (skipDuplicates) {
      const existingTickets = new Set(
        db.prepare(`SELECT ticket FROM issues WHERE ticket != ''`).all().map((r) => String(r.ticket))
      )
      // pre-load existing fingerprint set (contact|date) for fast DB-level dedupe
      const dbKeys = new Set(
        db.prepare(`SELECT contact_number || '|' || start_call AS k FROM issues WHERE deleted = 0 AND contact_number != ''`).all().map((r) => r.k)
      )
      const seen = new Set()
      toInsert = valid.filter((r) => {
        const t = String(r['Ticket'] || '').trim()
        if (t) {
          if (existingTickets.has(t) || seen.has(t)) { skipped++; return false }
          seen.add(t)
        }
        // fallback: same contact + same start call = duplicate
        const key = `${r['Contact Number']}|${r['Start Call']}`
        if (key !== '|') {
          if (seen.has(key) || dbKeys.has(key)) { skipped++; return false }
          seen.add(key)
        }
        return true
      })
    }

    const user = { id: session.user.id, name: session.user.name, username: session.user.username }
    const CHUNK = 2000
    let inserted = 0
    for (let i = 0; i < toInsert.length; i += CHUNK) {
      const res = bulkCreateIssues(toInsert.slice(i, i + CHUNK), user)
      inserted += res.count
    }

    return NextResponse.json({ success: true, inserted, skipped, total: valid.length })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}


import { google } from 'googleapis'

const SHEET_ID = process.env.GOOGLE_SHEET_ID
const SHEET_NAME = process.env.GOOGLE_SHEET_NAME || 'Sheet1'
const EXTRA_SHEETS = (process.env.EXTRA_SHEETS || '').split(',').map(s => s.trim()).filter(Boolean)

const COLUMNS = [
  'Start Call', '2nd Call', 'Closing Date', 'Branch',
  'Complaints Destination', 'Mobile Type', 'Sold By',
  'Customer Name', 'Contact Number', 'Description',
  'Final Conclusion', 'Status', 'Handled by', 'Issue code',
  'Exception', 'Amount Refund', 'Follow up',
  'Ticket', 'Duplicate', 'Note',
]

const ACTIVITY_COLUMNS = ['Timestamp', 'User', 'Action', 'IssueId', 'IssueTicket', 'Details']

let _auth = null

function getAuth() {
  if (_auth) return _auth
  const key = JSON.parse(
    Buffer.from(process.env.GOOGLE_SERVICE_KEY_B64, 'base64').toString()
  )
  _auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
  return _auth
}

function getSheets() {
  return google.sheets({ version: 'v4', auth: getAuth() })
}

function rowToObject(row) {
  const obj = {}
  COLUMNS.forEach((col, i) => {
    obj[col] = row[i] || ''
  })
  return obj
}

function objectToRow(obj) {
  return COLUMNS.map((col) => obj[col] || '')
}

async function getSheetData(sheetName) {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:T`,
  })
  const rows = res.data.values || []
  if (rows.length <= 1) return []
  const [, ...data] = rows
  return data.map((row, i) => ({
    id: `${sheetName}-${i + 2}`,
    _sheet: sheetName,
    ...rowToObject(row),
  }))
}

export async function getAllIssues() {
  const allSheets = [SHEET_NAME, ...EXTRA_SHEETS]
  const results = await Promise.all(allSheets.map(s => getSheetData(s).catch(() => [])))
  return results.flat().reverse()
}

const SEARCH_COLUMNS = ['Ticket', 'Customer Name', 'Contact Number', 'Issue code', 'Description', 'Branch', 'Mobile Type', 'Sold By', 'Handled by', 'Status']

async function getSheetRowCount(sheetName) {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A:A`,
  })
  const rows = res.data.values || []
  return Math.max(0, rows.length - 1)
}

export async function getTotalCountAll() {
  const allSheets = [SHEET_NAME, ...EXTRA_SHEETS]
  const counts = await Promise.all(allSheets.map(s => getSheetRowCount(s).catch(() => 0)))
  return { sheets: allSheets, counts, total: counts.reduce((a, b) => a + b, 0) }
}

export async function getIssuesPage(page = 1, pageSize = 50) {
  const { sheets, counts, total } = await getTotalCountAll()
  const startIdx = (page - 1) * pageSize
  const endIdx = Math.min(page * pageSize - 1, total - 1)
  if (startIdx > endIdx) return []

  const results = []
  let accumulated = 0

  for (let i = 0; i < sheets.length; i++) {
    const sheetName = sheets[i]
    const sheetCount = counts[i]
    const sheetEnd = accumulated + sheetCount - 1

    if (startIdx <= sheetEnd && endIdx >= accumulated) {
      const localStart = Math.max(0, startIdx - accumulated) + 2
      const localEnd = Math.min(sheetCount - 1, endIdx - accumulated) + 2

      const s = getSheets()
      const res = await s.spreadsheets.values.get({
        spreadsheetId: SHEET_ID,
        range: `${sheetName}!A${localStart}:T${localEnd}`,
      })
      const rows = res.data.values || []
      rows.forEach((row, idx) => {
        results.push({
          id: `${sheetName}-${localStart + idx}`,
          _sheet: sheetName,
          ...rowToObject(row),
        })
      })
    }

    accumulated += sheetCount
    if (accumulated > endIdx) break
  }

  return results
}

export async function getSearchIssues(query) {
  const all = await getAllIssues()
  if (!query) return all
  const q = query.toLowerCase()
  return all.filter(issue =>
    SEARCH_COLUMNS.some(col => (issue[col] || '').toLowerCase().includes(q))
  )
}

export async function getIssueById(id) {
  const issueId = String(id)
  const parts = issueId.split('-')
  if (parts.length < 2) return null
  const sheetName = parts.slice(0, -1).join('-')
  const rowIndex = parseInt(parts[parts.length - 1])
  if (isNaN(rowIndex) || rowIndex < 2) return null

  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A${rowIndex}:T${rowIndex}`,
  })
  const row = res.data.values?.[0]
  if (!row) return null
  return { id: issueId, _sheet: sheetName, ...rowToObject(row) }
}

export async function createIssue(data) {
  const sheets = getSheets()
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A:A`,
  })
  const nextNum = String((res.data.values?.length || 1) + 1000)
  data['Ticket'] = nextNum
  const row = objectToRow(data)
  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${SHEET_NAME}!A:T`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  })
  return { success: true }
}

export async function updateIssue(id, data) {
  const sheets = getSheets()
  const issueId = String(id)
  const parts = issueId.split('-')
  const sheetName = parts.length > 1 ? parts[0] : SHEET_NAME
  const rowIndex = parseInt(parts[parts.length - 1])
  const row = objectToRow(data)
  await sheets.spreadsheets.values.update({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A${rowIndex}:T${rowIndex}`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  })
  return { success: true }
}

export async function deleteIssue(id) {
  const sheets = getSheets()
  const issueId = String(id)
  const parts = issueId.split('-')
  const sheetName = parts.length > 1 ? parts[0] : SHEET_NAME
  const rowIndex = parseInt(parts[parts.length - 1])

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A${rowIndex}:T${rowIndex}`,
  })
  const row = res.data.values?.[0]
  if (!row) return { success: true }

  const now = new Date().toISOString().split('T')[0]
  const noteIdx = COLUMNS.indexOf('Note')
  if (noteIdx >= 0) {
    const existingNote = row[noteIdx] || ''
    row[noteIdx] = `[Trashed: ${now} from ${sheetName}] ${existingNote}`.trim()
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `Trash!A:T`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  })

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `Trash!A${rowIndex}:T${rowIndex}`,
  })
  return { success: true }
}

export async function getPerformance() {
  try {
    const all = await getAllIssues()
    const map = {}
    for (const issue of all) {
      const name = issue['Handled by'] || 'Unassigned'
      if (!map[name]) map[name] = { name, total: 0, closed: 0, pending: 0, pending48h: 0, escalated: 0 }
      map[name].total++
      const s = issue['Status']
      if (s === 'Closed') map[name].closed++
      else if (s === 'Pending') map[name].pending++
      else if (s === 'Pending 48H') map[name].pending48h++
      else if (s === 'Escalated') map[name].escalated++
    }
    return Object.values(map).sort((a, b) => b.total - a.total)
  } catch { return [] }
}

export async function getFollowups() {
  try {
    const all = await getAllIssues()
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const todayStr = today.toISOString().split('T')[0]
    return all.filter(issue => {
      const fu = issue['Follow up']
      if (!fu || issue['Status'] === 'Closed') return false
      const d = new Date(fu)
      if (isNaN(d.getTime())) return false
      d.setHours(0, 0, 0, 0)
      return d <= today
    }).slice(0, 50)
  } catch { return [] }
}

export async function logActivity(entry) {
  try {
    const sheets = getSheets()
    const row = ACTIVITY_COLUMNS.map(col => entry[col] || '')
    await sheets.spreadsheets.values.append({
      spreadsheetId: SHEET_ID,
      range: `Activity!A:F`,
      valueInputOption: 'USER_ENTERED',
      requestBody: { values: [row] },
    })
  } catch {}
}

export async function getActivity(issueId) {
  try {
    const sheets = getSheets()
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `Activity!A:F`,
    })
    const rows = res.data.values || []
    if (rows.length <= 1) return []
    const [, ...data] = rows
    return data.reverse().map((row) => {
      const obj = {}
      ACTIVITY_COLUMNS.forEach((col, i) => { obj[col] = row[i] || '' })
      return obj
    }).filter(a => a.IssueId === issueId)
  } catch { return [] }
}

export async function getTrashIssues() {
  try {
    const sheets = getSheets()
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `Trash!A:T`,
    })
    const rows = res.data.values || []
    if (rows.length <= 1) return []
    const [, ...data] = rows
    return data.map((row, i) => ({
      id: `Trash-${i + 2}`,
      _sheet: 'Trash',
      ...rowToObject(row),
    }))
  } catch { return [] }
}

export async function restoreIssue(id) {
  const sheets = getSheets()
  const issueId = String(id)
  const rowIndex = parseInt(issueId.split('-').pop())
  if (isNaN(rowIndex) || rowIndex < 2) return { success: false }

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: `Trash!A${rowIndex}:T${rowIndex}`,
  })
  const row = res.data.values?.[0]
  if (!row) return { success: false }

  const noteIdx = COLUMNS.indexOf('Note')
  let originalSheet = SHEET_NAME
  if (noteIdx >= 0 && row[noteIdx]) {
    const match = row[noteIdx].match(/\[Trashed: [^\]]+ from ([^\]]+)\]/)
    if (match) originalSheet = match[1]
    row[noteIdx] = row[noteIdx].replace(/\[Trashed: [^\]]+ from [^\]]+\]\s*/, '')
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: `${originalSheet}!A:T`,
    valueInputOption: 'USER_ENTERED',
    requestBody: { values: [row] },
  })

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `Trash!A${rowIndex}:T${rowIndex}`,
  })
  return { success: true }
}

export async function permanentDelete(id) {
  const sheets = getSheets()
  const issueId = String(id)
  const rowIndex = parseInt(issueId.split('-').pop())
  if (isNaN(rowIndex) || rowIndex < 2) return { success: false }

  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `Trash!A${rowIndex}:T${rowIndex}`,
  })
  return { success: true }
}

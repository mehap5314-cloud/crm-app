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

function getAuth() {
  const key = JSON.parse(
    Buffer.from(process.env.GOOGLE_SERVICE_KEY_B64, 'base64').toString()
  )
  return new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  })
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
  return results.flat()
}

export async function getIssueById(id) {
  const issues = await getAllIssues()
  return issues.find((i) => i.id === String(id)) || null
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
  await sheets.spreadsheets.values.clear({
    spreadsheetId: SHEET_ID,
    range: `${sheetName}!A${rowIndex}:T${rowIndex}`,
  })
  return { success: true }
}

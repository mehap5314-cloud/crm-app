import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'
import { getSheets, SHEET_ID, ACTIVITY_COLUMNS } from '@/lib/googleSheets'

export async function GET(req) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id') || ''
  const customer = searchParams.get('customer') || ''

  try {
    const sheets = getSheets()
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: 'Activity!A:F',
    })
    const rows = res.data.values || []
    if (rows.length <= 1) return NextResponse.json({ history: [] })

    const [, ...data] = rows
    const all = data.reverse().map((row) => {
      const obj = {}
      ACTIVITY_COLUMNS.forEach((col, i) => { obj[col] = row[i] || '' })
      return obj
    })

    const history = all.filter(a => {
      if (!a.Action?.includes('Feedback')) return false
      if (!id && !customer) return true
      if (a.Action === 'Update Feedback' && a.Details === `ID: ${id}`) return true
      if (a.Action === 'Create Feedback' && customer && a.Details === `Customer: ${customer}`) return true
      return false
    })

    return NextResponse.json({ history })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { getAllFeedback, createFeedback, updateFeedback, logActivity } from '@/lib/googleSheets'
import { NextResponse } from 'next/server'

function now() {
  const fmt = (n) => String(n).padStart(2, '0')
  const d = new Date()
  const [date, time] = d.toLocaleString('en-CA', { timeZone: 'Africa/Cairo' }).split(', ')
  const [y, m, day] = date.split('-')
  return `${fmt(day)}-${fmt(m)}-${y} - ${time}`
}

export async function GET(req) {
  try {
    const feedback = await getAllFeedback()
    return NextResponse.json({ feedback })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  let user = 'test@test.com'

  const session = await getServerSession(getAuthOptions()).catch(() => null)
  if (session) {
    user = session.user?.email || session.user?.name || 'unknown'
  }

  try {
    const data = await req.json()
    const ts = now()
    const payload = { ...data, 'Created By': user, 'Modified By': user, 'Modified At': ts }
    await createFeedback(payload)
    logActivity({ Timestamp: ts, User: user, Action: 'Create Feedback', Details: `Customer: ${data['Customer'] || 'N/A'}` })
    return NextResponse.json({ success: true, user })
  } catch (err) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 })
  }
}

export async function PUT(req) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id, ...data } = await req.json()
    const user = session.user?.email || session.user?.name || 'unknown'
    const ts = now()
    await updateFeedback(id, { ...data, 'Modified By': user, 'Modified At': ts })
    logActivity({ Timestamp: ts, User: user, Action: 'Update Feedback', Details: `ID: ${id}` })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

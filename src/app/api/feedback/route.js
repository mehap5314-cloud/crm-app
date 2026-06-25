import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { getAllFeedback, createFeedback, updateFeedback, logActivity } from '@/lib/googleSheets'
import { NextResponse } from 'next/server'

function now() {
  const d = new Date()
  return `${d.getDate()}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`
}

export async function GET(req) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const feedback = await getAllFeedback()
    return NextResponse.json({ feedback })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await req.json()
    const user = session.user?.email || session.user?.name || 'unknown'
    await createFeedback({ ...data, 'Created By': user, 'Modified By': user })
    logActivity({ Timestamp: now(), User: user, Action: 'Create Feedback', Details: `Customer: ${data['Customer'] || 'N/A'}` })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { id, ...data } = await req.json()
    const user = session.user?.email || session.user?.name || 'unknown'
    await updateFeedback(id, { ...data, 'Modified By': user })
    logActivity({ Timestamp: now(), User: user, Action: 'Update Feedback', Details: `ID: ${id}` })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

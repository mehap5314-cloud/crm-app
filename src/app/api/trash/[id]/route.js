import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { restoreIssue, permanentDelete } from '@/lib/googleSheets'
import { NextResponse } from 'next/server'

export async function POST(req, { params }) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  try {
    const result = await restoreIssue(params.id)
    if (!result.success) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  try {
    await permanentDelete(params.id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

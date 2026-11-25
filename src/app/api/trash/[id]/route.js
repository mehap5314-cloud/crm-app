import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { restoreIssueData, permanentDeleteData } from '@/lib/issuesData'
import { NextResponse } from 'next/server'

export async function POST(req, { params }) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin' && session.user.role !== 'manager') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const user = { id: session.user.id, name: session.user.name, username: session.user.username }
    const result = restoreIssueData(params.id, user)
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden — admin only' }, { status: 403 })
  }

  try {
    return NextResponse.json(permanentDeleteData(params.id))
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

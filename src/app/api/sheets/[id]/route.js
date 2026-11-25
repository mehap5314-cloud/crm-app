import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { getIssueData, getIssueRaw, updateIssueData, softDeleteIssue } from '@/lib/issuesData'
import { getIssueHistory } from '@/lib/history'
import { NextResponse } from 'next/server'

export async function GET(req, { params }) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const includeHistory = new URL(req.url).searchParams.has('history')
    const issue = getIssueData(params.id)
    if (!issue) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    if (includeHistory) {
      return NextResponse.json({ issue, history: getIssueHistory(params.id) })
    }
    return NextResponse.json(issue)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req, { params }) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await req.json()
    const user = { id: session.user.id, name: session.user.name, username: session.user.username }
    const result = updateIssueData(params.id, data, user)
    if (!result.success) return NextResponse.json({ error: result.error }, { status: result.error === 'Issue not found' ? 404 : 400 })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Only admins/managers may delete (soft delete -> trash)
export async function DELETE(req, { params }) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const role = session.user.role
  if (role !== 'admin' && role !== 'manager') {
    return NextResponse.json({ error: 'Forbidden — only admin/manager can delete' }, { status: 403 })
  }

  try {
    const user = { id: session.user.id, name: session.user.name, username: session.user.username }
    const result = softDeleteIssue(params.id, user)
    if (!result.success) return NextResponse.json({ error: result.error }, { status: 404 })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

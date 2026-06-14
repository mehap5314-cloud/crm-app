import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { getIssueById, updateIssue, deleteIssue } from '@/lib/googleSheets'
import { NextResponse } from 'next/server'

export async function GET(req, { params }) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const issue = await getIssueById(params.id)
    if (!issue) return NextResponse.json({ error: 'Not found' }, { status: 404 })
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
    await updateIssue(params.id, data)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

const ADMIN_EMAILS = ['mehap5314@gmail.com']

export async function DELETE(req, { params }) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!ADMIN_EMAILS.includes(session.user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    await deleteIssue(params.id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

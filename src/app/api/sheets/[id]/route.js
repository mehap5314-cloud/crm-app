import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { getIssueById, updateIssue, deleteIssue, logActivity } from '@/lib/googleSheets'
import { invalidateCache } from '@/lib/cache'
import { NextResponse } from 'next/server'

const issueCache = { data: {}, expiry: {} }
const ISSUE_TTL = 300000

export async function GET(req, { params }) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = params.id
  if (issueCache.data[id] && Date.now() < issueCache.expiry[id]) {
    return NextResponse.json(issueCache.data[id])
  }

  try {
    const issue = await getIssueById(id)
    if (!issue) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    issueCache.data[id] = issue
    issueCache.expiry[id] = Date.now() + ISSUE_TTL
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
    const old = await getIssueById(params.id)
    await updateIssue(params.id, data)
    invalidateCache()
    delete issueCache.data[params.id]; delete issueCache.expiry[params.id]
    const changed = Object.keys(data).filter(k => data[k] !== (old ? old[k] : '')).join(', ')
    logActivity({
      Timestamp: new Date().toISOString(),
      User: `${session.user.name || ''} (${session.user.email})`,
      Action: 'Updated issue',
      IssueId: params.id,
      IssueTicket: old?.['Ticket'] || data['Ticket'] || '',
      Details: `Changed: ${changed || 'N/A'}`,
    })
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
    const old = await getIssueById(params.id)
    await deleteIssue(params.id)
    invalidateCache()
    delete issueCache.data[params.id]; delete issueCache.expiry[params.id]
    logActivity({
      Timestamp: new Date().toISOString(),
      User: `${session.user.name || ''} (${session.user.email})`,
      Action: 'Deleted issue',
      IssueId: params.id,
      IssueTicket: old?.['Ticket'] || '',
      Details: `Customer: ${old?.['Customer Name'] || 'N/A'}`,
    })
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

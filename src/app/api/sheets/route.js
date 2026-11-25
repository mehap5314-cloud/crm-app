import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { listIssues, createIssueData, searchByContact } from '@/lib/issuesData'
import { ensureBootRestore } from '@/lib/sheetSync'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // On free hosts the DB file can be wiped on restart — recover from the sheet once.
  await ensureBootRestore()

  const { searchParams } = new URL(req.url)

  // Fast duplicate lookup by contact number (used by the issue form)
  const searchBy = searchParams.get('searchBy')
  if (searchBy) {
    try {
      const exclude = searchParams.get('excludeId')
      return NextResponse.json({ issues: searchByContact(searchBy, exclude) })
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  try {
    const result = listIssues({
      search: searchParams.get('search') || '',
      status: searchParams.get('status') || '',
      branch: searchParams.get('branch') || '',
      destination: searchParams.get('destination') || '',
      issueCode: searchParams.get('issueCode') || '',
      handledBy: searchParams.get('handledBy') || '',
      from: searchParams.get('from') || '',
      to: searchParams.get('to') || '',
      page: Math.max(1, parseInt(searchParams.get('page') || '1')),
      pageSize: Math.min(500, Math.max(1, parseInt(searchParams.get('pageSize') || '50'))),
      all: searchParams.has('all'),
      sort: searchParams.get('sort') || 'id_desc',
      deleted: searchParams.get('deleted') === '1',
    })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await req.json()
    const user = { id: session.user.id, name: session.user.name, username: session.user.username }
    const result = createIssueData(data, user, { source: 'manual' })
    return NextResponse.json({ success: true, ...result })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

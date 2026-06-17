import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { getAllIssues, createIssue } from '@/lib/googleSheets'
import { getFromCache, setCache, invalidateCache } from '@/lib/cache'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cached = getFromCache()
  if (cached) return NextResponse.json(cached)

  try {
    const all = await getAllIssues()
    const issues = all.map(({ Note, ...rest }) => rest)
    setCache(issues)
    return NextResponse.json(issues)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const data = await req.json()
    await createIssue(data)
    invalidateCache()
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

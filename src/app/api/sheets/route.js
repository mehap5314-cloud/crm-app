import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { getIssuesPage, getSearchIssues, getTotalCountAll, getAllIssues } from '@/lib/googleSheets'
import { getFromCache, setCache, invalidateCache } from '@/lib/cache'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const forceRefresh = searchParams.has('refresh')
  const searchQuery = searchParams.get('search') || ''
  const getAll = searchParams.has('all')
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.min(500, Math.max(1, parseInt(searchParams.get('pageSize') || '50')))

  const cacheKey = `list-v2`
  const cached = getFromCache(cacheKey)

  if (searchQuery) {
    const all = await getSearchIssues(searchQuery)
    const issues = all.map(({ Note, ...rest }) => rest)
    return NextResponse.json({ issues, total: issues.length, page: 1, pageSize: issues.length })
  }

  if (getAll) {
    if (!forceRefresh && cached) {
      return NextResponse.json({ issues: cached.data, total: cached.total })
    }
    try {
      const all = await getAllIssues()
      const clean = all.map(({ Note, ...rest }) => rest)
      setCache(cacheKey, { data: clean, total: clean.length })
      return NextResponse.json({ issues: clean, total: clean.length })
    } catch (err) {
      return NextResponse.json({ error: err.message }, { status: 500 })
    }
  }

  if (!forceRefresh && cached) {
    const { data, total } = cached
    const start = (page - 1) * pageSize
    const paged = data.slice(start, start + pageSize)
    return NextResponse.json({ issues: paged, total, page, pageSize })
  }

  try {
    const all = await getAllIssues()
    const clean = all.map(({ Note, ...rest }) => rest)
    setCache(cacheKey, { data: clean, total: clean.length })
    const start = (page - 1) * pageSize
    const paged = clean.slice(start, start + pageSize)
    return NextResponse.json({ issues: paged, total: clean.length, page, pageSize })
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

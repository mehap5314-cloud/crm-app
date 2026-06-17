import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { getAllIssues } from '@/lib/googleSheets'
import { getFromCache, setCache } from '@/lib/cache'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const cached = getFromCache('stats')
  if (cached) return NextResponse.json(cached)

  try {
    const all = await getAllIssues()
    const today = new Date().toISOString().split('T')[0]
    const stats = {
      total: all.length,
      pending: all.filter(i => i['Status'] === 'Pending').length,
      pending48h: all.filter(i => i['Status'] === 'Pending 48H').length,
      escalated: all.filter(i => i['Status'] === 'Escalated').length,
      closed: all.filter(i => i['Status'] === 'Closed').length,
      today: all.filter(i => (i['Start Call'] || '').startsWith(today)).length,
    }
    setCache('stats', stats)
    return NextResponse.json(stats)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

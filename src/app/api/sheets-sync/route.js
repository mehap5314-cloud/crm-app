import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { getDb } from '@/lib/db'
import { getSyncStatus, fullSync } from '@/lib/sheetSync'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  return NextResponse.json(getSyncStatus())
}

// Full re-mirror: pushes every issue to the Google Sheet tab (admin only).
// keepFirstRow=false clears the tab data before pushing.
export async function POST(req) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { clearFirst = false } = await req.json().catch(() => ({}))
    const rows = getDb().prepare('SELECT * FROM issues ORDER BY id ASC').all()
    const result = await fullSync(rows, { clearFirst: !!clearFirst })
    return NextResponse.json(result)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

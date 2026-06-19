import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { getTrashIssues } from '@/lib/googleSheets'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!session.user.isAdmin) return NextResponse.json({ error: 'Admin only' }, { status: 403 })

  try {
    const trash = await getTrashIssues()
    const issues = trash.map(({ Note, ...rest }) => rest)
    return NextResponse.json(issues)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

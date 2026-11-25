import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { getIssueHistory } from '@/lib/history'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const issueId = searchParams.get('issueId')
  if (!issueId) return NextResponse.json([])

  try {
    const history = getIssueHistory(issueId).reverse() // newest first
    return NextResponse.json(history)
  } catch {
    return NextResponse.json([])
  }
}

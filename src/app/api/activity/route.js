import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { getActivity } from '@/lib/googleSheets'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const issueId = searchParams.get('issueId')

  try {
    const activity = await getActivity(issueId || '')
    return NextResponse.json(activity)
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

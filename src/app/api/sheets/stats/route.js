import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { getStats } from '@/lib/issuesData'
import { ensureBootRestore } from '@/lib/sheetSync'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await ensureBootRestore()

  try {
    return NextResponse.json(getStats())
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

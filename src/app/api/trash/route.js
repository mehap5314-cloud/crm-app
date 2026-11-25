import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { listTrash } from '@/lib/issuesData'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
  const pageSize = Math.min(500, Math.max(1, parseInt(searchParams.get('pageSize') || '50')))

  try {
    return NextResponse.json(listTrash({ page, pageSize }))
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

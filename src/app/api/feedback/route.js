import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { getAllFeedback } from '@/lib/googleSheets'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const feedback = await getAllFeedback()
    return NextResponse.json({ feedback })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

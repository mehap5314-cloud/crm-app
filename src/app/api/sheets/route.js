import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { getAllIssues, createIssue } from '@/lib/googleSheets'
import { NextResponse } from 'next/server'

export async function GET() {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const issues = await getAllIssues()
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
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

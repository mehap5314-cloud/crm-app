import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import { getAllIssues, updateIssue } from '@/lib/googleSheets'
import { NextResponse } from 'next/server'

export async function PATCH(req) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const { ids, updates } = await req.json()
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'No ids provided' }, { status: 400 })
    }

    const allIssues = await getAllIssues()
    let updated = 0

    for (const id of ids) {
      const issue = allIssues.find(i => i.id === String(id))
      if (!issue) continue
      const merged = { ...issue, ...updates }
      await updateIssue(id, merged)
      updated++
    }

    return NextResponse.json({ success: true, updated })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

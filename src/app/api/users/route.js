import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function GET(req) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const users = getDb().prepare(
    'SELECT id, username, name, role, branch, active, created_at FROM users ORDER BY id ASC'
  ).all()
  return NextResponse.json({ users })
}

export async function POST(req) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const { username, name, password, role = 'agent', branch = '' } = await req.json()
    if (!username || !username.trim()) return NextResponse.json({ error: 'Username is required' }, { status: 400 })
    if (!name || !name.trim()) return NextResponse.json({ error: 'Full name is required' }, { status: 400 })
    if (!password || password.length < 4) return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 })
    if (!['admin', 'manager', 'agent'].includes(role)) return NextResponse.json({ error: 'Invalid role' }, { status: 400 })

    const db = getDb()
    const exists = db.prepare('SELECT id FROM users WHERE username = ? COLLATE NOCASE').get(username.trim())
    if (exists) return NextResponse.json({ error: 'Username already taken' }, { status: 400 })

    const info = db.prepare(
      'INSERT INTO users (username, name, role, branch, password_hash, active, created_at) VALUES (?,?,?,?,?,1,?)'
    ).run(username.trim(), name.trim(), role, branch, bcrypt.hashSync(password, 10), new Date().toISOString())

    return NextResponse.json({ success: true, id: info.lastInsertRowid })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'
import { getDb } from '@/lib/db'
import { NextResponse } from 'next/server'

const selfGuard = (session, id, action) => {
  // Admin can do anything; a user can only change own password
  return session.user.role === 'admin' || (action === 'password' && String(session.user.id) === String(id))
}

export async function PATCH(req, { params }) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const id = Number(params.id)
    const db = getDb()
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const body = await req.json()
    const isAdmin = session.user.role === 'admin'

    if (isAdmin) {
      const updates = {}
      if (body.name !== undefined) updates.name = String(body.name).trim()
      if (body.role !== undefined && ['admin', 'manager', 'agent'].includes(body.role)) updates.role = body.role
      if (body.branch !== undefined) updates.branch = body.branch
      if (body.active !== undefined) updates.active = body.active ? 1 : 0

      // prevent locking yourself out
      if (user.id === Number(session.user.id) && updates.active === 0) {
        return NextResponse.json({ error: 'You cannot deactivate your own account' }, { status: 400 })
      }

      if (Object.keys(updates).length > 0) {
        const setSql = Object.keys(updates).map((k) => `${k} = ?`).join(', ')
        db.prepare(`UPDATE users SET ${setSql} WHERE id = ?`).run(...Object.values(updates), id)
      }
    }

    // Password change (admin for anyone; user for self)
    if (body.password !== undefined) {
      if (!selfGuard(session, String(params.id), 'password') && !isAdmin) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      const password = String(body.password)
      if (password.length < 4) return NextResponse.json({ error: 'Password must be at least 4 characters' }, { status: 400 })
      db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(bcrypt.hashSync(password, 10), id)
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req, { params }) {
  const session = await getServerSession(getAuthOptions())
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (session.user.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  try {
    const id = Number(params.id)
    if (id === Number(session.user.id)) {
      return NextResponse.json({ error: 'You cannot delete your own account' }, { status: 400 })
    }
    const db = getDb()
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id)
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
    db.prepare('UPDATE users SET active = 0 WHERE id = ?').run(id)
    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

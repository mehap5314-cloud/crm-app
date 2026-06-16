import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { getAuthOptions } from '@/lib/auth'

export async function POST() {
  await getServerSession(getAuthOptions())
  const res = NextResponse.json({ ok: true })
  const isSecure = process.env.NEXTAUTH_URL?.startsWith('https') || process.env.VERCEL === '1'
  const prefix = isSecure ? '__Secure-' : ''

  res.cookies.set(`${prefix}next-auth.session-token`, '', { expires: new Date(0), path: '/', httpOnly: true, secure: isSecure, sameSite: 'lax' })
  res.cookies.set(`${prefix}next-auth.csrf-token`, '', { expires: new Date(0), path: '/', httpOnly: true, secure: isSecure, sameSite: 'lax' })
  res.cookies.set(`${prefix}next-auth.callback-url`, '', { expires: new Date(0), path: '/', secure: isSecure, sameSite: 'lax' })

  res.headers.set('Cache-Control', 'no-store')
  return res
}

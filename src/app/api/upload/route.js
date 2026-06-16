import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ error: 'Uploads are handled client-side (data URIs)' }, { status: 400 })
}
